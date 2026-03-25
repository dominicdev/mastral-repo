# Mastra + Next.js — Setup Guide

Based on the official guide: https://mastra.ai/guides/getting-started/next-js

---

## Prerequisites

- Node.js **v22.13.0** or later
- An API key from a supported model provider

---

## Step 1 — Create a Next.js Project

```bash
npx create-next-app@latest my-nextjs-agent \
  --yes --ts --eslint --tailwind \
  --src-dir --app --turbopack \
  --no-react-compiler --no-import-alias
```

```bash
cd my-nextjs-agent
```

---

## Step 2 — Initialize Mastra

```bash
npx mastra@latest init
```

This generates a `src/mastra/` folder with:

| File | Description |
|------|-------------|
| `index.ts` | Mastra instance — registers agents, tools, workflows |
| `agents/weather-agent.ts` | Example agent |
| `tools/weather-tool.ts` | Example tool |

---

## Step 3 — Install AI SDK & UI Components

```bash
npm install @mastra/ai-sdk@latest @ai-sdk/react ai
```

```bash
npx ai-elements@latest
```

> `ai-elements` downloads the full AI chat UI component library into `src/components/ai-elements/`
> — includes `<Conversation>`, `<Message>`, `<PromptInput>`, `<Tool>`, and more.

---

## Step 4 — Set Up Environment Variables

Create a `.env` file in the project root:

```env
# Required — pick your model provider
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Optional — enables Mastra Cloud tracing & Studio
MASTRA_CLOUD_ACCESS_TOKEN=your_token_here
```

### Get your Google Generative AI key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy and paste into `.env`

> Free tier — no credit card required.

### Get your Mastra Cloud token

Mastra Cloud stores traces and powers the remote Studio dashboard. **Optional** — app works without it.

1. Go to **https://cloud.mastra.ai**
2. Sign up / log in
3. Create a new **Project**
4. Go to **Settings → API Keys**
5. Click **"Generate Access Token"**
6. Copy and paste into `.env`

If you skip this, you'll see this warning (safe to ignore):
```
mastra-cloud-observability-exporter disabled: MASTRA_CLOUD_ACCESS_TOKEN not set
```

---

## Step 5 — Create the API Route

Create `src/app/api/chat/route.ts`:

```typescript
import { handleChatStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'
import { NextResponse } from 'next/server'

const THREAD_ID = 'example-user-id'
const RESOURCE_ID = 'weather-chat'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'weather-agent',
    params: {
      ...params,
      memory: { ...params.memory, thread: THREAD_ID, resource: RESOURCE_ID },
    },
  })
  return createUIMessageStreamResponse({ stream })
}

export async function GET() {
  const memory = await mastra.getAgentById('weather-agent').getMemory()
  let response = null
  try {
    response = await memory?.recall({ threadId: THREAD_ID, resourceId: RESOURCE_ID })
  } catch {
    console.log('No previous messages found.')
  }
  const uiMessages = toAISdkV5Messages(response?.messages || [])
  return NextResponse.json(uiMessages)
}
```

---

## Step 6 — Create the Chat Page

Create `src/app/chat/page.tsx` using:

- `useChat()` from `@ai-sdk/react` with `DefaultChatTransport`
- `sendMessage({ text })` to send messages
- `message.parts` to render text and tool calls
- AI Elements components for the UI

Key patterns:
```typescript
// Hook setup
const { messages, sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
})

// Render message parts
message.parts?.map((part) => {
  if (part.type === 'text') return <MessageResponse>{part.text}</MessageResponse>
  if (part.type?.startsWith('tool-')) return <Tool>...</Tool>
})
```

---

## Step 7 — Run

```bash
npm run dev
```

Visit **http://localhost:3000/chat**

---

## Step 8 — (Optional) Mastra Studio

Mastra Studio lets you inspect agents, memory, traces, and tool calls locally.

```bash
# In a separate terminal
npx mastra dev
```

Visit **http://localhost:4111**

---

## Common Gotchas

| Problem | Fix |
|---------|-----|
| `append is not a function` | Use `sendMessage({ text })` — not `append()` — in `@ai-sdk/react` v3 |
| `message.content` is undefined | Use `message.parts` — AI SDK v6 stores content in parts |
| `isLoading` prop warning | Use `status` prop on `<PromptInputSubmit>` — not `isLoading` |
| Workflow not found | `mastra.getWorkflow()` uses the **object key** (e.g. `'approvalWorkflow'`), not the workflow `id` |
| `createRun is not async` | Always `await workflow.createRun()` before calling `.start()` |
| Tool `context` is undefined | Tool `execute` receives input as first arg directly: `execute: async (inputData) => inputData.field` |
| Voice not working | Speech Recognition requires **Chrome** or **Edge** — not Firefox/Safari |

---

## Useful Links

- Official guide: https://mastra.ai/guides/getting-started/next-js
- Mastra docs: https://mastra.ai/docs
- Mastra Cloud: https://cloud.mastra.ai
- Google AI Studio: https://aistudio.google.com/apikey
- AI Elements components: `npx ai-elements@latest`
