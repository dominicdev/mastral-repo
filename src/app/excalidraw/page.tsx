'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilRulerIcon,
  UploadIcon,
  LinkIcon,
  XIcon,
  ImageIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { Shimmer } from '@/components/ai-elements/shimmer'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExcalidrawElement {
  type: string
  id: string
  x: number
  y: number
  width?: number
  height?: number
  angle?: number
  strokeColor?: string
  backgroundColor?: string
  text?: string
  fontSize?: number
  textAlign?: string
  points?: [number, number][]
  startArrowhead?: string | null
  endArrowhead?: string | null
  isDeleted?: boolean
  roundness?: { type: number } | null
}

interface ExcalidrawData {
  type: string
  version: number
  elements: ExcalidrawElement[]
  appState: { viewBackgroundColor: string }
  files: Record<string, unknown>
}

// ─── Example Images ───────────────────────────────────────────────────────────

const EXAMPLE_IMAGES = [
  {
    label: 'Flowchart',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Flowchart_example.svg/480px-Flowchart_example.svg.png',
  },
  {
    label: 'UML Class',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Singleton_UML_class_diagram.svg/480px-Singleton_UML_class_diagram.svg.png',
  },
  {
    label: 'Network',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/NetworkTopologies.svg/480px-NetworkTopologies.svg.png',
  },
  {
    label: 'Algorithm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Euclid_algorithm_flowchart_diagram_in_Breton.svg/360px-Euclid_algorithm_flowchart_diagram_in_Breton.svg.png',
  },
  {
    label: 'Architecture',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Content_persistence.system_architecture.diagram.svg/600px-Content_persistence.system_architecture.diagram.svg.png',
  },
]

// ─── SVG Preview Renderer ────────────────────────────────────────────────────

function ExcalidrawSVGPreview({ data }: { data: ExcalidrawData }) {
  const elements = data.elements.filter(el => !el.isDeleted)
  if (elements.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No elements to preview
      </div>
    )
  }

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const x = el.x ?? 0
    const y = el.y ?? 0
    const w = el.width ?? 0
    const h = el.height ?? 0
    if (el.points && el.points.length > 0) {
      for (const [px, py] of el.points) {
        minX = Math.min(minX, x + px)
        minY = Math.min(minY, y + py)
        maxX = Math.max(maxX, x + px)
        maxY = Math.max(maxY, y + py)
      }
    } else {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w)
      maxY = Math.max(maxY, y + h)
    }
  }

  const pad = 30
  const vw = maxX - minX + pad * 2
  const vh = maxY - minY + pad * 2
  const viewBox = `${minX - pad} ${minY - pad} ${vw} ${vh}`

  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      style={{ background: data.appState?.viewBackgroundColor || '#ffffff' }}
    >
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#1e1e1e" />
        </marker>
      </defs>
      {elements.map(el => {
        const stroke = el.strokeColor || '#1e1e1e'
        const fill = (!el.backgroundColor || el.backgroundColor === 'transparent') ? 'none' : el.backgroundColor
        const sw = 2

        switch (el.type) {
          case 'rectangle': {
            const rx = el.roundness ? 8 : 0
            return (
              <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height}
                stroke={stroke} fill={fill} strokeWidth={sw} rx={rx} />
            )
          }
          case 'ellipse': {
            const rx = (el.width ?? 0) / 2
            const ry = (el.height ?? 0) / 2
            return (
              <ellipse key={el.id} cx={(el.x ?? 0) + rx} cy={(el.y ?? 0) + ry}
                rx={rx} ry={ry} stroke={stroke} fill={fill} strokeWidth={sw} />
            )
          }
          case 'diamond': {
            const cx = (el.x ?? 0) + (el.width ?? 0) / 2
            const cy = (el.y ?? 0) + (el.height ?? 0) / 2
            const pts = [
              `${cx},${el.y}`,
              `${(el.x ?? 0) + (el.width ?? 0)},${cy}`,
              `${cx},${(el.y ?? 0) + (el.height ?? 0)}`,
              `${el.x},${cy}`,
            ].join(' ')
            return (
              <polygon key={el.id} points={pts} stroke={stroke} fill={fill} strokeWidth={sw} />
            )
          }
          case 'text': {
            const lines = (el.text || '').split('\n')
            const fontSize = el.fontSize ?? 16
            const cx = (el.x ?? 0) + (el.width ?? 0) / 2
            const cy = (el.y ?? 0) + (el.height ?? 0) / 2 - ((lines.length - 1) * fontSize * 0.6) / 2
            return (
              <g key={el.id}>
                {lines.map((line, i) => (
                  <text
                    key={i}
                    x={cx}
                    y={cy + i * fontSize * 1.2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily="sans-serif"
                    fill={stroke}
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          }
          case 'arrow':
          case 'line': {
            if (!el.points || el.points.length < 2) return null
            const pts = el.points.map(([px, py]) => `${(el.x ?? 0) + px},${(el.y ?? 0) + py}`).join(' ')
            const hasArrow = el.type === 'arrow' || el.endArrowhead
            return (
              <polyline key={el.id} points={pts} stroke={stroke} fill="none"
                strokeWidth={sw} markerEnd={hasArrow ? 'url(#arrow)' : undefined} />
            )
          }
          default:
            return null
        }
      })}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExcalidrawPage() {
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [result, setResult] = useState<ExcalidrawData | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convert = useCallback(async () => {
    if (!previewUrl && !imageUrl) {
      setError('Please provide an image first.')
      return
    }

    setIsConverting(true)
    setResult(null)
    setError('')

    try {
      const body = imageBase64
        ? { imageBase64, mimeType }
        : { imageUrl }

      const response = await fetch('/api/excalidraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await response.json()
      if (!response.ok || json.error) {
        setError(json.error || 'Conversion failed.')
        return
      }

      setResult(json.data)
      setActiveTab('preview')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }, [imageBase64, mimeType, imageUrl, previewUrl])

  const loadUrl = (url: string) => {
    setImageBase64('')
    setMimeType('')
    setPreviewUrl(url)
    setImageUrl(url)
    setResult(null)
    setError('')
  }

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageBase64(dataUrl.split(',')[1])
      setMimeType(file.type)
      setPreviewUrl(dataUrl)
      setImageUrl('')
      setResult(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setPreviewUrl('')
    setImageUrl('')
    setImageBase64('')
    setMimeType('')
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadExcalidraw = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.excalidraw'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyJSON = async () => {
    if (!result) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-6xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
            <PencilRulerIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Image to Excalidraw</h1>
            <p className="text-base text-muted-foreground">Convert diagrams into editable Excalidraw JSON</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isConverting ? (
              <Shimmer className="text-base" duration={1.2}>Converting...</Shimmer>
            ) : (
              <>
                <span className="h-3.5 w-3.5 rounded-full bg-indigo-500" />
                <span className="text-base text-muted-foreground">Gemini Vision</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-10 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

            {/* Left — Image input */}
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-foreground">Input Image</h2>

              {/* Preview or dropzone */}
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Input" className="h-72 w-full object-contain" />
                  <button
                    onClick={clearImage}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-background hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-colors ${
                    isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-muted/20 hover:border-indigo-500/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-foreground">Drop a diagram image</p>
                    <p className="text-sm text-muted-foreground">Flowcharts, UML, architecture diagrams work best</p>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />

              {/* URL input */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadUrl(imageUrl)}
                    placeholder="https://example.com/diagram.png"
                    className="h-13 w-full rounded-xl border border-border bg-background py-3.5 pl-12 pr-4 text-base placeholder:text-muted-foreground focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  onClick={() => loadUrl(imageUrl)}
                  disabled={!imageUrl.trim()}
                  className="flex h-13 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Load
                </button>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-13 items-center justify-center gap-3 rounded-xl border border-border bg-background text-base font-medium text-foreground hover:border-indigo-500/40 hover:bg-muted/50"
              >
                <UploadIcon className="h-5 w-5" />
                Upload from device
              </button>

              {/* Example images */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_IMAGES.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => loadUrl(ex.url)}
                      className="rounded-full border border-border bg-muted/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-600"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              {/* Convert button */}
              <button
                onClick={convert}
                disabled={isConverting || (!previewUrl && !imageUrl)}
                className="flex h-14 items-center justify-center gap-3 rounded-xl bg-indigo-600 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isConverting ? (
                  <>
                    <RefreshCwIcon className="h-5 w-5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <PencilRulerIcon className="h-5 w-5" />
                    Convert to Excalidraw
                  </>
                )}
              </button>
            </div>

            {/* Right — Output */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Output</h2>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyJSON}
                      className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                    <button
                      onClick={downloadExcalidraw}
                      className="flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Download .excalidraw
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              {result && (
                <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
                  {(['preview', 'json'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-lg py-2.5 text-base font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'preview' ? '🖼️ Preview' : '{ } JSON'}
                    </button>
                  ))}
                </div>
              )}

              {/* Output panel */}
              <div className="min-h-[28rem] flex-1 rounded-2xl border border-border bg-card">
                {isConverting && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
                      <PencilRulerIcon className="h-8 w-8 animate-pulse text-indigo-500" />
                    </div>
                    <Shimmer className="text-lg font-medium" duration={1.5}>
                      Analyzing and converting...
                    </Shimmer>
                    <p className="text-sm text-muted-foreground">
                      Gemini is tracing shapes, arrows, and labels
                    </p>
                  </div>
                )}

                {!isConverting && !result && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
                    <PencilRulerIcon className="h-12 w-12 opacity-30" />
                    <p className="text-base">
                      {previewUrl
                        ? 'Click "Convert to Excalidraw" to start'
                        : 'Load an image first, then convert'}
                    </p>
                    <p className="text-sm opacity-70">
                      Works best with flowcharts, UML diagrams, and architecture drawings
                    </p>
                  </div>
                )}

                {result && activeTab === 'preview' && (
                  <div className="flex h-full flex-col">
                    <div className="flex-1 overflow-hidden rounded-t-2xl p-4" style={{ minHeight: '28rem' }}>
                      <ExcalidrawSVGPreview data={result} />
                    </div>
                    <div className="rounded-b-2xl border-t border-border bg-muted/20 px-5 py-3">
                      <p className="text-sm text-muted-foreground">
                        {result.elements.filter(e => !e.isDeleted).length} elements ·{' '}
                        <span className="text-foreground">Download and open in </span>
                        <a
                          href="https://excalidraw.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-500 hover:underline"
                        >
                          excalidraw.com
                        </a>
                        {' '}to edit
                      </p>
                    </div>
                  </div>
                )}

                {result && activeTab === 'json' && (
                  <div className="h-full overflow-auto rounded-2xl">
                    <pre className="p-6 text-sm leading-relaxed text-foreground">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* How to use */}
              {result && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
                  <p className="text-sm font-medium text-indigo-600">How to open in Excalidraw</p>
                  <ol className="mt-2 space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Click <strong className="text-foreground">Download .excalidraw</strong> above</li>
                    <li>Go to <a href="https://excalidraw.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">excalidraw.com</a></li>
                    <li>Click the menu <strong className="text-foreground">☰</strong> → <strong className="text-foreground">Open</strong> → select the file</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
