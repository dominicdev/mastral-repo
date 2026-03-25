'use client'

import { useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  NetworkIcon,
  SearchIcon,
  PenLineIcon,
  CodeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ZapIcon,
} from 'lucide-react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
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
  'Research quantum computing and write a beginner-friendly blog post',
  'Build a Python web scraper and explain how it works',
  'Research the history of the internet and summarize the key milestones',
  'Write a professional email asking for a project deadline extension',
  'Create a JavaScript function to debounce API calls with tests',
]

const AGENT_META: Record<string, { label: string; icon: typeof SearchIcon; color: string; bg: string; border: string }> = {
  researchAgent: {
    label: 'Research Specialist',
    icon: SearchIcon,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  writerAgent: {
    label: 'Content Writer',
    icon: PenLineIcon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  coderAgent: {
    label: 'Code Engineer',
    icon: CodeIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
}

function getAgentKey(toolType: string): string | null {
  // tool type format: "tool-agent-researchAgent" → "researchAgent"
  const match = toolType.match(/^tool-agent-(.+)$/)
  return match ? match[1] : null
}

function AgentDelegationCard({ part }: { part: ToolUIPart }) {
  const [expanded, setExpanded] = useState(false)
  const agentKey = getAgentKey(part.type)
  const meta = agentKey ? AGENT_META[agentKey] : null

  if (!meta) {
    // Generic tool fallback
    return (
      <div className="my-4 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <span className="font-mono">{part.type}</span>
      </div>
    )
  }

  const Icon = meta.icon
  const isLoading = part.state !== 'output-available' && part.state !== 'result'
  const input = typeof part.input === 'object' && part.input !== null
    ? (part.input as Record<string, unknown>)
    : {}
  const task = (input.messages as string) || (input.prompt as string) || JSON.stringify(input)
  const output = part.output
    ? (typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2))
    : null

  return (
    <div className={`my-4 rounded-xl border ${meta.border} bg-card overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3 ${meta.bg}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg}`}>
          <Icon className={`h-4 w-4 ${meta.color}`} />
        </div>
        <div className="flex-1">
          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
          {isLoading && (
            <Shimmer className="ml-2 text-xs" duration={1.2}>Working…</Shimmer>
          )}
        </div>
        {output && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            {expanded ? 'Hide' : 'Show'} response
          </button>
        )}
      </div>

      {/* Task given to sub-agent */}
      {task && (
        <div className="border-t border-border/50 px-5 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Task</p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">{task}</p>
        </div>
      )}

      {/* Sub-agent response (expandable) */}
      {output && expanded && (
        <div className="border-t border-border/50 px-5 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Response</p>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {output}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="border-t border-border/50 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupervisorPage() {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/supervisor' }),
  })

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

  // Count unique agents used in current messages
  const agentsUsed = new Set(
    messages.flatMap(m =>
      (m.parts ?? [])
        .filter((p: { type: string }) => p.type?.startsWith('tool-agent-'))
        .map((p: { type: string }) => getAgentKey(p.type))
        .filter(Boolean)
    )
  )

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <NetworkIcon className="h-8 w-8 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Supervisor Agent</h1>
            <p className="text-base text-muted-foreground">Multi-agent orchestration — research, write, and code</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Agent roster */}
            <div className="flex items-center gap-2">
              {Object.entries(AGENT_META).map(([key, meta]) => {
                const Icon = meta.icon
                const used = agentsUsed.has(key)
                return (
                  <div
                    key={key}
                    title={meta.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                      used ? `${meta.bg} ${meta.border}` : 'border-border bg-muted/30'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${used ? meta.color : 'text-muted-foreground'}`} />
                  </div>
                )
              })}
            </div>
            {isStreaming ? (
              <Shimmer className="text-base" duration={1.2}>Orchestrating…</Shimmer>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-violet-500" />
                <span className="text-base text-muted-foreground">Ready</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto max-w-5xl px-10 py-10">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-8 flex items-center gap-4">
                  {/* Supervisor node */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                    <ZapIcon className="h-8 w-8 text-violet-500" />
                  </div>
                  {/* Arrows + sub-agents */}
                  <div className="flex flex-col gap-2">
                    {Object.entries(AGENT_META).map(([key, meta]) => {
                      const Icon = meta.icon
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <div className="h-px w-8 bg-border" />
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.border} ${meta.bg}`}>
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                          </div>
                          <span className="text-sm text-muted-foreground">{meta.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <h2 className="mb-3 text-3xl font-semibold text-foreground">Give me any complex task</h2>
                <p className="mb-10 max-w-lg text-lg text-muted-foreground">
                  The supervisor will analyze your request and delegate to the right specialists automatically.
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

                  if (part.type?.startsWith('tool-agent-')) {
                    return (
                      <AgentDelegationCard
                        key={`${message.id}-${i}`}
                        part={part as ToolUIPart}
                      />
                    )
                  }

                  if (part.type?.startsWith('tool-')) {
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="my-4 rounded-xl border border-border bg-muted/30 px-5 py-3 text-sm text-muted-foreground font-mono"
                      >
                        {part.type}
                      </div>
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

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card px-10 py-6">
        <div className="mx-auto max-w-5xl">
          <PromptInput onSubmit={handleSubmit} className="shadow-sm">
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything — the supervisor will coordinate the right specialists…"
                className="min-h-[5rem] text-lg"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <p className="text-sm text-muted-foreground">
                Powered by Research · Writing · Code specialists
              </p>
              <PromptInputSubmit
                status={status}
                onStop={stop}
                disabled={!input.trim() && !isStreaming}
                className="h-12 w-12 bg-violet-600 hover:bg-violet-700"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
