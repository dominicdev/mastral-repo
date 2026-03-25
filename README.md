# Mastra AI Examples

AI-powered examples built with [Mastra](https://mastra.ai), Next.js, and TypeScript.

## What is Mastra?

Mastra is a TypeScript framework for building AI agents. It handles the hard parts — calling LLMs, using tools, remembering conversations, and running multi-step workflows — so you can focus on what your agent actually does.

> Guide used to build this: [mastra.ai/guides/getting-started/next-js](https://mastra.ai/guides/getting-started/next-js)

---

## Setup

```bash
npm install
cp .env.example .env   # add your API keys
npm run dev            # http://localhost:3000
```

**Required keys in `.env`:**

```
GOOGLE_GENERATIVE_AI_API_KEY=   # Google Gemini (used by all agents)
```

---

## How Mastra works in this project

Everything lives in `src/mastra/`. There are three main concepts:

### 1. Agents
An agent is an AI that can talk, think, and use tools. You give it a name, a prompt, and optionally some tools and memory.

```ts
new Agent({
  id: 'my-agent',
  instructions: 'You are a helpful assistant...',
  model: 'google/gemini-2.5-pro',
  tools: { myTool },
  memory: new Memory(), // remembers past conversations
})
```

### 2. Tools
A tool is a function the agent can call to get real data — like fetching a stock price or weather. You define the input/output schema with Zod so the agent knows exactly how to use it.

```ts
createTool({
  id: 'get-stock-price',
  description: 'Fetch real-time stock price',
  inputSchema: z.object({ symbol: z.string() }),
  outputSchema: z.object({ price: z.number(), ... }),
  execute: async ({ symbol }) => { /* fetch from API */ },
})
```

### 3. Workflows
A workflow chains steps together. Steps can pass data to each other — and they can **pause and wait for a human** before continuing.

```ts
createWorkflow({ id: 'my-workflow', ... })
  .then(generateDraftStep)   // AI writes a draft
  .then(humanReviewStep)     // pauses here — waits for approval
  .then(finalizeStep)        // resumes after approval
  .commit()
```

### Connecting to Next.js
Each example has an API route that calls a Mastra agent and streams the response back to the UI:

```ts
// src/app/api/chat/route.ts
const stream = await handleChatStream({ mastra, agentId: 'weather-agent', params })
return createUIMessageStreamResponse({ stream })
```

The frontend uses `useChat()` from AI SDK to send messages and receive streamed responses.

---

## Examples

| Example | Route | What it does |
|---|---|---|
| **Mastra Assistant** | `/chat` | General chat with memory — remembers your conversation across reloads |
| **Stock Tracker** | `/stock` | Ask for any stock ticker — gets live price, change, volume, market cap |
| **Image Analyzer** | `/image` | Upload an image — Gemini Vision identifies objects, animals, vehicles |
| **Image to Excalidraw** | `/excalidraw` | Upload a diagram — converts it to editable Excalidraw JSON |
| **Voice Agent** | `/voice` | Talk with your mic — speech-to-text in, text-to-speech out |
| **Supervisor Agent** | `/supervisor` | Delegates your task to the right specialist (researcher, writer, or coder) |
| **Workflow: Approve** | `/workflow` | AI drafts a blog post → you approve or reject → AI publishes the final version |
| **Crypto Analyst** | `/crypto` | Real-time crypto prices + 7-day trend + AI-generated 24h outlook |

---

## Project structure

```
src/mastra/
├── index.ts              # registers all agents, workflows, storage
├── agents/               # one file per agent
├── tools/                # stock, crypto, weather tools
└── workflows/            # approval workflow (suspend/resume)

src/app/
├── api/                  # one API route per example
├── [example]/page.tsx    # one page per example
└── page.tsx              # homepage gallery
```

---

## Mastra Studio (optional)

A local UI to inspect agents, traces, memory, and workflows.

```bash
npx mastra dev   # opens at http://localhost:4111
```

---

## Links

- [Mastra Docs](https://mastra.ai/docs)
- [Next.js + Mastra Guide](https://mastra.ai/guides/getting-started/next-js)
- [AI SDK](https://sdk.vercel.ai)
