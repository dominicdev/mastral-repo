# Mastra + Next.js Setup Guide

> Source: https://mastra.ai/guides/getting-started/next-js

Build a tool-calling AI agent with Mastra and connect it to Next.js. You'll get a working chat UI with streaming responses, tool calls, and persistent memory.

---

## Before You Start

- Node.js `v22.13.0` or later
- An API key from a model provider (OpenAI, Google Gemini, etc.)

---

## Step 1 — Create a Next.js App

Skip this if you already have a Next.js project.

```bash
npx create-next-app@latest my-nextjs-agent --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

Then navigate into it:

```bash
cd my-nextjs-agent
```

---

## Step 2 — Initialize Mastra

Run `mastra init` and follow the prompts to choose a model provider and enter your API key:

```bash
npx mastra@latest init
```

This creates a `src/mastra/` folder with:

| File | What it does |
|---|---|
| `index.ts` | Mastra config — registers agents, storage, memory |
| `agents/weather-agent.ts` | An example agent with a weather tool |
| `tools/weather-tool.ts` | A tool that fetches weather for a given location |

> **Running Mastra Studio alongside Next.js?**
> Both processes use different working directories, so relative DB paths break.
> Set an absolute path in `src/mastra/index.ts`:
> ```ts
> url: 'file:/absolute/path/to/your/project/mastra.db'
> ```

---

## Step 3 — Install AI SDK + AI Elements

Install the AI SDK and the Mastra adapter:

```bash
npm install @mastra/ai-sdk@latest @ai-sdk/react ai
```

Then initialize the AI Elements component library:

```bash
npx ai-elements@latest
```

Choose the default options when prompted. This downloads pre-built chat UI components into `src/components/ai-elements/`.

---

## Step 4 — Create the API Route

Create `src/app/api/chat/route.ts`:

```ts
import { handleChatStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'
import { NextResponse } from 'next/server'

const THREAD_ID = 'example-user-id'
const RESOURCE_ID = 'weather-chat'

// POST — send a message and stream the agent's response
export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'weather-agent',
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: THREAD_ID,
        resource: RESOURCE_ID,
      },
    },
  })
  return createUIMessageStreamResponse({ stream })
}

// GET — load previous messages from memory on page refresh
export async function GET() {
  const memory = await mastra.getAgentById('weather-agent').getMemory()
  let response = null

  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    })
  } catch {
    console.log('No previous messages found.')
  }

  const uiMessages = toAISdkV5Messages(response?.messages || [])
  return NextResponse.json(uiMessages)
}
```

- **POST** — accepts a message and streams the agent's response back
- **GET** — fetches conversation history so the UI can restore it on reload

---

## Step 5 — Create the Chat Page

Create `src/app/chat/page.tsx`:

```tsx
'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'

import { PromptInput, PromptInputBody, PromptInputTextarea } from '@/components/ai-elements/prompt-input'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

function Chat() {
  const [input, setInput] = useState('')

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  // Load message history on mount
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setMessages(data))
  }, [setMessages])

  const handleSubmit = async () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="relative h-screen w-full p-6">
      <div className="flex h-full flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map(message => (
              <div key={message.id}>
                {message.parts?.map((part, i) => {

                  // Render text messages
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                    )
                  }

                  // Render tool calls
                  if (part.type?.startsWith('tool-')) {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          type={(part as ToolUIPart).type}
                          state={(part as ToolUIPart).state || 'output-available'}
                        />
                        <ToolContent>
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

        <PromptInput onSubmit={handleSubmit} className="mt-20">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={status !== 'ready'}
            />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  )
}

export default Chat
```

---

## Step 6 — Run and Test

```bash
npm run dev
```

Open [http://localhost:3000/chat](http://localhost:3000/chat) and ask about the weather. If your API key is set correctly, the agent will call the weather tool and stream a response.

---

## How It All Fits Together

```
User types message
      │
      ▼
useChat() → POST /api/chat
      │
      ▼
handleChatStream({ mastra, agentId, params })
      │
      ▼
Agent runs (calls weatherTool if needed)
      │
      ▼
createUIMessageStreamResponse(stream)
      │
      ▼
Streamed chunks back to useChat()
      │
      ▼
<MessageResponse> renders the text live
```

---

## Adding Your Own Agent

**1. Create a tool** in `src/mastra/tools/my-tool.ts`:

```ts
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const myTool = createTool({
  id: 'my-tool',
  description: 'What this tool does',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ query }) => {
    return { result: `You asked: ${query}` }
  },
})
```

**2. Create an agent** in `src/mastra/agents/my-agent.ts`:

```ts
import { Agent } from '@mastra/core/agent'
import { myTool } from '../tools/my-tool'

export const myAgent = new Agent({
  id: 'my-agent',
  instructions: 'You are a helpful assistant...',
  model: 'google/gemini-2.5-pro',
  tools: { myTool },
})
```

**3. Register it** in `src/mastra/index.ts`:

```ts
import { myAgent } from './agents/my-agent'

export const mastra = new Mastra({
  agents: { weatherAgent, myAgent },
  ...
})
```

**4. Add an API route** at `src/app/api/my-agent/route.ts` — copy the chat route and change `agentId` to `'my-agent'`.

---

## Next Steps

- [Mastra Agents docs](https://mastra.ai/docs/agents)
- [Mastra Tools docs](https://mastra.ai/docs/tools)
- [Mastra Workflows docs](https://mastra.ai/docs/workflows)
- [Deploy to Vercel](https://mastra.ai/docs/deployment/vercel)
