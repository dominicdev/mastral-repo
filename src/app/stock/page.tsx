'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import { TrendingUpIcon, TrendingDownIcon, BarChart2Icon, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'

const SUGGESTIONS = [
  'What is the price of AAPL?',
  'How is TSLA doing today?',
  'Get me NVDA stock info',
  'Compare MSFT and GOOGL',
  'Show me META stock',
  'What is Amazon trading at?',
]

export default function StockPage() {
  const [input, setInput] = useState('')

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/stock' }),
  })

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('/api/stock')
      const data = await res.json()
      setMessages([...data])
    }
    fetchMessages()
  }, [setMessages])

  const handleSubmit = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestion = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex h-screen w-full flex-col bg-background">

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <BarChart2Icon className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Stock Price Tracker</h1>
            <p className="text-base text-muted-foreground">Real-time quotes powered by Yahoo Finance</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isStreaming ? (
              <Shimmer className="text-base" duration={1.2}>Fetching data...</Shimmer>
            ) : (
              <>
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                <span className="text-base text-muted-foreground">Live</span>
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
                <div className="mb-8 flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10">
                    <TrendingUpIcon className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10">
                    <TrendingDownIcon className="h-10 w-10 text-red-500" />
                  </div>
                </div>
                <h2 className="mb-4 text-3xl font-semibold text-foreground">Ask about any stock</h2>
                <p className="mb-12 max-w-lg text-lg text-muted-foreground">
                  Get real-time prices, daily changes, market cap, volume, and 52-week ranges.
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
                {message.parts?.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent className="text-lg leading-loose">
                          <MessageResponse>{part.text}</MessageResponse>
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

      {/* Suggestion chips after first message */}
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
                onChange={e => setInput(e.target.value)}
                value={input}
                placeholder="Ask about a stock — e.g. What is Apple's price?"
                disabled={isStreaming}
                className="  text-lg px-2 py-4"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-4 pb-4 pt-1 justify-end">
              <PromptInputSubmit
                status={status}
                onStop={stop}
                size="icon-sm"
                className="h-12 w-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Prices are fetched live from Yahoo Finance · Data may be delayed 15 min
          </p>
        </div>
      </div>

    </div>
  )
}
