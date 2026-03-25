'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import { SparklesIcon, ArrowLeftIcon } from 'lucide-react'
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

function Chat() {
  const [input, setInput] = useState < string > ('')

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages([...data])
    }
    fetchMessages()
  }, [setMessages])

  const handleSubmit = async () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex h-screen w-full flex-col bg-background">

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <SparklesIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Mastra Assistant</h1>
            <p className="text-base text-muted-foreground">Powered by Mastra AI</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span
              className={`h-3.5 w-3.5 rounded-full ${isStreaming ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                }`}
            />
            <span className="text-base text-muted-foreground">
              {isStreaming ? 'Thinking...' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto max-w-5xl px-10 py-10">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-muted">
                  <span className="text-6xl">✨</span>
                </div>
                <h2 className="mb-4 text-3xl font-semibold text-foreground">How can I help you?</h2>
                <p className="max-w-lg text-lg text-muted-foreground">
                  Start a conversation. Ask me anything and I'll do my best to assist you.
                </p>
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
                        className="my-5 rounded-2xl border border-border bg-muted/40"
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

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-card px-10 py-6">
        <div className="mx-auto max-w-5xl">
          <PromptInput onSubmit={handleSubmit} className="shadow-sm">
            <PromptInputBody>
              <PromptInputTextarea
                onChange={e => setInput(e.target.value)}
                value={input}
                placeholder="Message Mastra Assistant..."
                disabled={isStreaming}
                className=" text-lg px-2 py-4"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-4 pb-4 pt-1 justify-end">
              <PromptInputSubmit
                status={status}
                onStop={stop}
                size="icon-sm"
                className="h-12 w-12 rounded-xl"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  )
}

export default Chat
