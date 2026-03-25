'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ScanSearchIcon, UploadIcon, LinkIcon, XIcon, ImageIcon } from 'lucide-react'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { MessageResponse } from '@/components/ai-elements/message'

const QUICK_QUERIES = [
  { label: '🔍 Identify Everything', query: 'Analyze this image thoroughly. Identify every subject, object, animal, vehicle, and person you can see.' },
  { label: '🐦 Find Birds', query: 'Focus on birds in this image. Identify species, count, colors, and behavior.' },
  { label: '🐾 Find Animals', query: 'Identify all animals in this image. Include species, breed if possible, count, and what they are doing.' },
  { label: '🚗 Find Vehicles', query: 'Identify all vehicles in this image. Include type, color, make and model if visible.' },
  { label: '📦 List All Objects', query: 'List and count all notable objects you can see in this image. Be specific and thorough.' },
  { label: '🏞️ Describe Scene', query: 'Describe the overall scene, setting, environment, and mood of this image in detail.' },
]

export default function ImagePage() {
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyze = useCallback(async (query: string) => {
    if (!previewUrl && !imageUrl) {
      setError('Please provide an image first.')
      return
    }

    setIsAnalyzing(true)
    setAnalysis('')
    setError('')

    try {
      const body = imageBase64
        ? { imageBase64, mimeType, query }
        : { imageUrl, query }

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Analysis failed.')
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAnalysis(text)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [imageBase64, mimeType, imageUrl, previewUrl])

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) return
    setImageBase64('')
    setMimeType('')
    setPreviewUrl(imageUrl.trim())
    setAnalysis('')
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
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setMimeType(file.type)
      setPreviewUrl(dataUrl)
      setImageUrl('')
      setAnalysis('')
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const clearImage = () => {
    setPreviewUrl('')
    setImageUrl('')
    setImageBase64('')
    setMimeType('')
    setAnalysis('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-6xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <ScanSearchIcon className="h-8 w-8 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Image Analyzer</h1>
            <p className="text-base text-muted-foreground">Identify birds, animals, vehicles, and objects</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isAnalyzing ? (
              <Shimmer className="text-base" duration={1.2}>Analyzing image...</Shimmer>
            ) : (
              <>
                <span className="h-3.5 w-3.5 rounded-full bg-violet-500" />
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

            {/* Left — Image Input */}
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-foreground">Image</h2>

              {/* Preview or drop zone */}
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-80 w-full object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex h-80 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-colors ${
                    isDragging
                      ? 'border-violet-500 bg-violet-500/5'
                      : 'border-border bg-muted/20 hover:border-violet-500/40 hover:bg-muted/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-foreground">Drop an image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF supported</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* URL input */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-muted-foreground">Or paste an image URL</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                      placeholder="https://example.com/image.jpg"
                      className="h-13 w-full rounded-xl border border-border bg-background py-3.5 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim()}
                    className="flex h-13 items-center gap-2 rounded-xl bg-violet-600 px-5 text-base font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Load
                  </button>
                </div>
              </div>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-13 items-center justify-center gap-3 rounded-xl border border-border bg-background text-base font-medium text-foreground transition-colors hover:border-violet-500/40 hover:bg-muted/50"
              >
                <UploadIcon className="h-5 w-5" />
                Upload from device
              </button>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Right — Analysis */}
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-foreground">Analysis</h2>

              {/* Quick queries */}
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Quick analysis</p>
                <Suggestions>
                  {QUICK_QUERIES.map(q => (
                    <Suggestion
                      key={q.label}
                      suggestion={q.label}
                      onClick={() => analyze(q.query)}
                      disabled={isAnalyzing || !previewUrl}
                      className="text-base px-5 py-2.5"
                    />
                  ))}
                </Suggestions>
              </div>

              {/* Results */}
              <div className="min-h-[20rem] flex-1 rounded-2xl border border-border bg-card p-6">
                {isAnalyzing && !analysis && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                      <ScanSearchIcon className="h-8 w-8 animate-pulse text-violet-500" />
                    </div>
                    <Shimmer className="text-lg font-medium" duration={1.5}>
                      Analyzing image...
                    </Shimmer>
                    <p className="text-sm text-muted-foreground">Gemini is examining the image</p>
                  </div>
                )}

                {!isAnalyzing && !analysis && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                    <ScanSearchIcon className="h-12 w-12 opacity-30" />
                    <p className="text-base">
                      {previewUrl
                        ? 'Click a quick analysis button above or ask a custom question below'
                        : 'Load an image to start analyzing'}
                    </p>
                  </div>
                )}

                {analysis && (
                  <div className="text-base leading-loose">
                    <MessageResponse>{analysis}</MessageResponse>
                  </div>
                )}
              </div>

              {/* Custom query input */}
              <div className="flex gap-3">
                <CustomQueryInput
                  onSubmit={analyze}
                  disabled={isAnalyzing || !previewUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function CustomQueryInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (query: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Ask something specific about the image..."
        disabled={disabled}
        className="h-13 flex-1 rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-13 items-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ask
      </button>
    </>
  )
}
