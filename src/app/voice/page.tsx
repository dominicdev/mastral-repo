'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  Trash2Icon,
} from 'lucide-react'

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

function getMessageText(parts: { type: string; text?: string }[] | undefined): string {
  if (!parts) return ''
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join('')
}

export default function VoicePage() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [supported, setSupported] = useState(true)

  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const submittedRef = useRef(false)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const isMutedRef = useRef(isMuted)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  isMutedRef.current = isMuted

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/voice' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  // Load TTS voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices()
      const english = all.filter(v => v.lang.startsWith('en'))
      if (english.length === 0) return
      setVoices(english)
      setSelectedVoiceName(prev => {
        if (prev) return prev
        const preferred =
          english.find(v => v.name.includes('Google') && v.name.includes('US')) ||
          english[0]
        selectedVoiceRef.current = preferred
        return preferred.name
      })
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  // Sync selectedVoiceRef when name changes
  useEffect(() => {
    const v = voices.find(v => v.name === selectedVoiceName)
    if (v) selectedVoiceRef.current = v
  }, [selectedVoiceName, voices])

  // When status transitions to 'ready', speak the last assistant message
  useEffect(() => {
    if (status === 'ready' && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = getMessageText((last as any).parts)
        if (!text || isMutedRef.current) { setVoiceState('idle'); return }

        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current
        utterance.rate = 1.05
        utterance.onstart = () => setVoiceState('speaking')
        utterance.onend = () => setVoiceState('idle')
        utterance.onerror = () => setVoiceState('idle')
        window.speechSynthesis.speak(utterance)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Show thinking state when loading starts
  useEffect(() => {
    if (isLoading) setVoiceState('thinking')
  }, [isLoading])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimTranscript, isLoading])

  const startListening = useCallback(() => {
    window.speechSynthesis.cancel()
    setVoiceState('idle')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SR as any)()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    submittedRef.current = false

    recognition.onstart = () => {
      setVoiceState('listening')
      setInterimTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setInterimTranscript(interim || final)
      if (final) {
        submittedRef.current = true
        setInterimTranscript('')
        sendMessage({ text: final.trim() })
      }
    }

    recognition.onerror = () => {
      setVoiceState('idle')
      setInterimTranscript('')
    }

    recognition.onend = () => {
      if (!submittedRef.current) {
        setVoiceState('idle')
        setInterimTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [sendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setVoiceState('idle')
    setInterimTranscript('')
  }, [])

  const handleMicClick = () => {
    if (voiceState === 'listening') {
      stopListening()
    } else if (voiceState === 'speaking') {
      window.speechSynthesis.cancel()
      setVoiceState('idle')
    } else if (voiceState === 'idle') {
      startListening()
    }
  }

  const handleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    if (next) {
      window.speechSynthesis.cancel()
      if (voiceState === 'speaking') setVoiceState('idle')
    }
  }

  const handleClear = () => {
    window.speechSynthesis.cancel()
    recognitionRef.current?.stop()
    setMessages([])
    setVoiceState('idle')
    setInterimTranscript('')
  }

  const statusConfig: Record<VoiceState, { text: string; sub?: string }> = {
    idle: { text: 'Tap to speak' },
    listening: { text: 'Listening…', sub: 'Tap again to stop' },
    thinking: { text: 'Thinking…' },
    speaking: { text: 'Speaking…', sub: 'Tap mic to interrupt' },
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-10 py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <MicIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Voice Agent</h1>
            <p className="text-sm text-muted-foreground">Speak naturally, get spoken responses</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {voices.length > 0 && (
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              value={selectedVoiceName}
              onChange={e => setSelectedVoiceName(e.target.value)}
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted"
          >
            {isMuted ? (
              <VolumeXIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Volume2Icon className="h-5 w-5 text-foreground" />
            )}
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear conversation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted"
            >
              <Trash2Icon className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Conversation transcript */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.length === 0 && !interimTranscript && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/10">
                <MicIcon className="h-10 w-10 text-purple-500" />
              </div>
              <p className="text-xl font-semibold text-foreground">Ready to listen</p>
              <p className="mt-2 text-base text-muted-foreground">
                Press the microphone button below and start talking
              </p>
              {!supported && (
                <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-500">
                  Speech recognition is not supported in this browser. Please use Chrome or Edge.
                </p>
              )}
            </div>
          )}

          {messages.map(message => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const text = getMessageText((message as any).parts)
            if (!text) return null
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-5 py-4 text-base leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'border border-border bg-card text-foreground'
                  }`}
                >
                  {text}
                </div>
              </div>
            )
          })}

          {/* Interim speech (in progress) */}
          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 text-base italic text-purple-400">
                {interimTranscript}
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-card px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mic control */}
      <div className="shrink-0 border-t border-border bg-card/50 py-10">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            {voiceState === 'listening' && (
              <>
                <div className="absolute h-36 w-36 animate-ping rounded-full bg-red-500/10" />
                <div className="absolute h-28 w-28 animate-ping rounded-full bg-red-500/15 [animation-delay:300ms]" />
              </>
            )}
            {voiceState === 'speaking' && (
              <>
                <div className="absolute h-36 w-36 animate-pulse rounded-full bg-purple-500/10" />
                <div className="absolute h-28 w-28 animate-pulse rounded-full bg-purple-500/15 [animation-delay:200ms]" />
              </>
            )}

            <button
              onClick={handleMicClick}
              disabled={voiceState === 'thinking' || !supported}
              className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
                voiceState === 'listening'
                  ? 'scale-110 bg-red-500 text-white hover:bg-red-600'
                  : voiceState === 'speaking'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : voiceState === 'thinking'
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-purple-600 text-white hover:scale-105 hover:bg-purple-700'
              }`}
            >
              {voiceState === 'listening' ? (
                <MicOffIcon className="h-9 w-9" />
              ) : (
                <MicIcon className="h-9 w-9" />
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{statusConfig[voiceState].text}</p>
            {statusConfig[voiceState].sub && (
              <p className="mt-0.5 text-xs text-muted-foreground">{statusConfig[voiceState].sub}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
