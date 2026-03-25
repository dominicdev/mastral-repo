import { mastra } from '@/mastra';
import { NextResponse } from 'next/server';

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced) return fenced[1].trim()

  // Find first { ... } block
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)

  return text.trim()
}

export async function POST(req: Request) {
  try {
    const { imageUrl, imageBase64, mimeType } = await req.json()

    let imageData: string
    let imageMimeType: string

    if (imageBase64) {
      imageData = imageBase64
      imageMimeType = mimeType || 'image/jpeg'
    } else if (imageUrl) {
      const response = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ExcalidrawBot/1.0)' },
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.statusText}` },
          { status: 400 }
        )
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      if (!contentType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'URL does not point to an image' },
          { status: 400 }
        )
      }

      const buffer = await response.arrayBuffer()
      imageData = Buffer.from(buffer).toString('base64')
      imageMimeType = contentType.split(';')[0]
    } else {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const agent = mastra.getAgentById('excalidraw-agent')

    const result = await agent.generate([
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: imageData,
            mimeType: imageMimeType as `image/${string}`,
          },
          {
            type: 'text',
            text: 'Convert this image to Excalidraw JSON. Output only the raw JSON object, nothing else.',
          },
        ],
      },
    ])

    const rawText = result.text
    const jsonStr = extractJSON(rawText)
    const excalidrawData = JSON.parse(jsonStr)

    // Ensure required top-level fields
    if (!excalidrawData.type) excalidrawData.type = 'excalidraw'
    if (!excalidrawData.version) excalidrawData.version = 2
    if (!excalidrawData.elements) excalidrawData.elements = []
    if (!excalidrawData.appState) excalidrawData.appState = { viewBackgroundColor: '#ffffff' }
    if (!excalidrawData.files) excalidrawData.files = {}

    return NextResponse.json({ data: excalidrawData })
  } catch (error) {
    console.error('Excalidraw conversion error:', error)
    const message = error instanceof SyntaxError
      ? 'AI returned invalid JSON. Try again.'
      : 'Conversion failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
