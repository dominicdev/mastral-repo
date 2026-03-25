'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import { ArrowLeftIcon, TrendingUpIcon, TrendingDownIcon, BitcoinIcon, ActivityIcon } from 'lucide-react'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'

const SUGGESTIONS = [
  'What is the price of Bitcoin?',
  'Give me the 24h outlook for Ethereum',
  'How is Solana performing today?',
  'Compare BTC and ETH performance this week',
  'Which has higher risk: DOGE or BTC?',
  '24h prediction for SOL',
]

export default function CryptoPage() {
  const [input, setInput] = useState('')

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/crypto' }),
  })

  useEffect(() => {
    fetch('/api/crypto')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setMessages(data) })
      .catch(() => {})
  }, [setMessages])

  const isStreaming = status === 'streaming' || status === 'submitted'

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestion = (s: string) => {
    if (isStreaming) return
    sendMessage({ text: s })
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-teal-500/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
            <BitcoinIcon className="h-8 w-8 text-teal-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Crypto Analyst</h1>
            <p className="text-base text-muted-foreground">Real-time prices + AI-powered 24h outlook</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isStreaming ? (
              <Shimmer className="text-base" duration={1.2}>Analyzing…</Shimmer>
            ) : (
              <>
                <ActivityIcon className="h-4 w-4 text-teal-500" />
                <span className="text-base text-muted-foreground">Live via CoinGecko</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto max-w-5xl px-10 py-10">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-8 flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-500/10">
                    <TrendingUpIcon className="h-10 w-10 text-teal-500" />
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10">
                    <TrendingDownIcon className="h-10 w-10 text-red-500" />
                  </div>
                </div>
                <h2 className="mb-4 text-3xl font-semibold text-foreground">Ask about any crypto</h2>
                <p className="mb-3 max-w-lg text-lg text-muted-foreground">
                  Get real-time prices, market data, and AI-generated 24-hour outlooks with possible price ranges.
                </p>
                <p className="mb-12 text-sm text-muted-foreground/60">
                  ⚠️ For informational purposes only — not financial advice
                </p>
                <Suggestions>
                  {SUGGESTIONS.map(s => (
                    <Suggestion
                      key={s}
                      suggestion={s}
                      onClick={handleSuggestion}
                      disabled={isStreaming}
                      className="text-base px-6 py-2.5"
                    />
                  ))}
                </Suggestions>
              </div>
            )}

            {messages.map(message => (
              <div key={message.id} className="mb-10">
                {(message.parts ?? []).map((part: { type: string; text?: string }, i: number) => {
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent className="text-lg leading-loose">
                          <MessageResponse>{part.text ?? ''}</MessageResponse>
                        </MessageContent>
                      </Message>
                    )
                  }

                  if (part.type?.startsWith('tool-')) {
                    return (
                      <Tool
                        key={`${message.id}-${i}`}
                        className="my-5 rounded-2xl border border-border bg-muted/30"
                      >
                        <ToolHeader
                          type={(part as ToolUIPart).type}
                          state={(part as ToolUIPart).state || 'output-available'}
                          className="cursor-pointer px-7 py-4 text-lg"
                        />
                        <ToolContent className="px-7 pb-6">
                          <ToolInput input={(part as ToolUIPart).input || {}} />
                          <ToolOutput
                            output={(part as ToolUIPart).output}
                            errorText={(part as ToolUIPart).errorText}
                          />
                        </ToolContent>
                      </Tool>
                    )
                  }

                  return null
                })}
              </div>
            ))}

            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>
      </div>

      {/* Suggestions after first message */}
      {messages.length > 0 && (
        <div className="shrink-0 border-t border-border/50 bg-card/50 px-10 py-4">
          <div className="mx-auto max-w-5xl">
            <Suggestions>
              {SUGGESTIONS.map(s => (
                <Suggestion
                  key={s}
                  suggestion={s}
                  onClick={handleSuggestion}
                  disabled={isStreaming}
                  className="text-base px-6 py-2.5"
                />
              ))}
            </Suggestions>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card px-10 py-6">
        <div className="mx-auto max-w-5xl">
          <PromptInput onSubmit={handleSubmit} className="shadow-sm">
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about a coin or request a 24h outlook — e.g. What's the BTC outlook for tomorrow?"
                disabled={isStreaming}
                className="text-lg px-2 py-4"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-4 pb-4 pt-1 justify-end">
              <PromptInputSubmit
                status={status}
                onStop={stop}
                size="icon-sm"
                className="h-12 w-12 rounded-xl bg-teal-600 text-white hover:bg-teal-700"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Prices via CoinGecko · AI outlook is speculative, not financial advice
          </p>
        </div>
      </div>

    </div>
  )
}
