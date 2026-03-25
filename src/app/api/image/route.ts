import { mastra } from '@/mastra';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageUrl, imageBase64, mimeType, query } = await req.json();

    let imageData: string;
    let imageMimeType: string;

    if (imageBase64) {
      // Uploaded file — already base64
      imageData = imageBase64;
      imageMimeType = mimeType || 'image/jpeg';
    } else if (imageUrl) {
      // Remote URL — fetch and convert to base64
      const response = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)' },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.statusText}` },
          { status: 400 }
        );
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'URL does not point to an image' },
          { status: 400 }
        );
      }

      const buffer = await response.arrayBuffer();
      imageData = Buffer.from(buffer).toString('base64');
      imageMimeType = contentType.split(';')[0];
    } else {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const agent = mastra.getAgentById('image-agent');

    const result = await agent.stream([
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
            text: query || 'Analyze this image. Identify everything you can see.',
          },
        ],
      },
    ]);

    // Stream plain text back to client
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
