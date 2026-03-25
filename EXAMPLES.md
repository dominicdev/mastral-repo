# Mastra AI — Example Pages

Examples sourced from the official Mastra GitHub repo:
https://github.com/mastra-ai/mastra/tree/main/examples

Filtered and adapted for Next.js. Each entry notes the original GitHub example it is based on.

---

## Status Legend

| Badge   | Meaning                                       |
| ------- | --------------------------------------------- |
| ✅ Live | Built and accessible in this project          |
| 🔜 Soon | Planned for this project                      |
| 📦 Ref  | Original GitHub example only, not yet adapted |

---

## ✅ Built in This Project

### 1. Mastra Assistant (Chat)

- **Route:** `/chat`
- **GitHub example:** `examples/agent`
- **Description:** General-purpose AI chat with tool calls and persistent memory across sessions.

### 2. Stock Price Tracker

- **Route:** `/stock`
- **GitHub example:** `examples/basics/stock-price-tool`
- **Description:** Real-time stock quotes, daily change, market cap, volume and 52-week range via Yahoo Finance.

---

## 🔜 Best Next.js Candidates (to build next)

These are directly from the GitHub examples repo and translate well into Next.js pages.

### 3. Bird Checker

- **Route:** `/bird-checker`
- **GitHub example:** `examples/bird-checker-with-nextjs`
- **Description:** Upload or paste an image URL — the agent checks if there's a bird in the photo and identifies the species.
- **Why Next.js:** Official Mastra Next.js example, easiest to port.

### 4. Weather Agent

- **Route:** `/weather`
- **GitHub example:** `examples/weather-agent`
- **Description:** Ask for current weather, forecast, and activity suggestions for any city. Uses Open-Meteo free API.
- **Why Next.js:** Simple agent + tool, great intro example.

### 5. Crypto Chatbot

- **Route:** `/crypto`
- **GitHub example:** `examples/crypto-chatbot`
- **Description:** Chat about cryptocurrency prices, trends, and market data. Conversational agent with crypto tools.
- **Why Next.js:** Very similar to the stock tracker, fast to build.

### 6. Memory — Todo Agent

- **Route:** `/todo`
- **GitHub example:** `examples/memory-todo-agent`
- **Description:** A todo manager powered by an agent that remembers your tasks across sessions using Mastra memory.
- **Why Next.js:** Great showcase of Mastra memory persistence in a UI.

### 7. Memory with Context

- **Route:** `/memory`
- **GitHub example:** `examples/memory-with-context`
- **Description:** Demonstrates how agents use working memory and conversation context to maintain state.
- **Why Next.js:** Good educational demo of how memory window works.

### 8. Text to SQL

- **Route:** `/sql`
- **GitHub example:** `examples/txt-to-sql`
- **Description:** Type a plain English question, get a SQL query back. Agent explains the query step by step.
- **Why Next.js:** Great showcase for `CodeBlock`, `Terminal`, `SchemaDisplay` components.

### 9. NotebookLM Clone

- **Route:** `/notebook`
- **GitHub example:** `examples/notebooklm-clone`
- **Description:** Upload documents and chat with them. Agent retrieves relevant chunks and cites sources inline.
- **Why Next.js:** Best showcase for `Sources`, `InlineCitation`, and `Artifact` components.

### 10. Travel App

- **Route:** `/travel`
- **GitHub example:** `examples/travel-app`
- **Description:** Plan a trip — the agent suggests destinations, itineraries, hotels, and weather based on preferences.
- **Why Next.js:** Full-stack app feel, good multi-tool agent demo.

### 11. Heads Up Game

- **Route:** `/headsup`
- **GitHub example:** `examples/heads-up-game`
- **Description:** AI-powered Heads Up card game. The agent generates categories, clues, and tracks scores.
- **Why Next.js:** Fun interactive demo, good for showing real-time streaming.

### 12. Image to Excalidraw

- **Route:** `/diagram`
- **GitHub example:** `examples/image-to-excalidraw`
- **Description:** Paste an image or screenshot — the agent converts it into an Excalidraw diagram description.
- **Why Next.js:** Great visual demo, uses the `Canvas` and `Artifact` components.

### 13. OpenAPI Spec Writer

- **Route:** `/openapi`
- **GitHub example:** `examples/openapi-spec-writer`
- **Description:** Describe an API in plain English, get a full OpenAPI YAML/JSON spec generated with the agent.
- **Why Next.js:** Best showcase for `Artifact`, `CodeBlock`, `Snippet` components.

### 14. Supervisor Agent (Multi-Agent)

- **Route:** `/error`
- **GitHub example:** `examples/supervisor-agent`
- **Description:** A supervisor agent that delegates tasks to sub-agents. Shows multi-agent orchestration patterns.
- **Why Next.js:** Good showcase of `Agent`, `Plan`, `Task` components.

### 15. AI Recruiter Workflow

- **Route:** `/recruiter`
- **GitHub example:** `examples/workflow-ai-recruiter`
- **Description:** Multi-step workflow that screens resumes, generates interview questions, and ranks candidates.
- **Why Next.js:** Best showcase for `Checkpoint`, `Queue`, `Plan`, `Confirmation` workflow components.

### 16. Workflow with Suspend & Resume

- **Route:** `/workflow`
- **GitHub example:** `examples/workflow-with-suspend-resume`
- **Description:** A workflow that pauses mid-execution for human approval, then resumes. Shows human-in-the-loop.
- **Why Next.js:** Great interactive demo — user clicks approve/deny to resume the workflow.

### 17. Realtime Voice Agent

- **Route:** `/voice`
- **GitHub example:** `examples/realtime-voice-agent`
- **Description:** Talk to the agent using your microphone. Real-time speech input and audio output.
- **Why Next.js:** Best showcase for `SpeechInput`, `AudioPlayer`, `MicSelector`, `VoiceSelector` components.

### 18. Fireworks R1 (Reasoning)

- **Route:** `/reasoning`
- **GitHub example:** `examples/fireworks-r1`
- **Description:** Watch a reasoning model think step-by-step before answering, with full chain-of-thought display.
- **Why Next.js:** Best showcase for `Reasoning`, `ChainOfThought` components.

### 19. Client-Side Tools

- **Route:** `/client-tools`
- **GitHub example:** `examples/client-side-tools`
- **Description:** Tools that execute directly in the browser — file reading, localStorage access, DOM inspection.
- **Why Next.js:** Unique to Next.js/browser context, shows client-side tool execution patterns.

### 20. Memory with Processors

- **Route:** `/processors`
- **GitHub example:** `examples/memory-with-processors`
- **Description:** Shows how to use message processors to limit, validate, or transform messages before they reach the agent.
- **Why Next.js:** Educational demo, good for showing message pipeline controls.

---

## 📦 GitHub Examples (Reference Only)

These exist in the Mastra repo but are backend-only, CLI-based, or use frameworks other than Next.js.

| GitHub Example                                | Why not Next.js                      |
| --------------------------------------------- | ------------------------------------ |
| `examples/a2a`                                | Agent-to-agent protocol, server-only |
| `examples/agent-v6`                           | CLI structured output demo           |
| `examples/auth`                               | Auth integration, backend only       |
| `examples/bird-checker-with-express`          | Express adapter                      |
| `examples/bird-checker-with-nextjs-and-eval`  | Eval/scoring, no UI                  |
| `examples/inngest`                            | Background jobs, server-only         |
| `examples/mcp-configuration`                  | MCP server config, CLI               |
| `examples/mcp-registry-registry`              | MCP registry, CLI                    |
| `examples/mcp-server-adapters`                | MCP server, backend                  |
| `examples/memory-with-libsql`                 | Storage config, no UI                |
| `examples/memory-with-mongodb`                | Storage config, no UI                |
| `examples/memory-with-pg`                     | Storage config, no UI                |
| `examples/memory-with-upstash`                | Storage config, no UI                |
| `examples/memory-with-schema`                 | Schema config, no UI                 |
| `examples/memory-with-template`               | Template config, no UI               |
| `examples/memory-per-resource-example`        | Backend config                       |
| `examples/processors-message-length-limiter`  | Backend processor                    |
| `examples/processors-response-length-limiter` | Backend processor                    |
| `examples/processors-response-validator`      | Backend processor                    |
| `examples/processors-with-ai-sdk`             | Backend processor                    |
| `examples/server-express-adapter`             | Express, not Next.js                 |
| `examples/server-fastify-adapter`             | Fastify, not Next.js                 |
| `examples/server-hono-adapter`                | Hono, not Next.js                    |
| `examples/server-koa-adapter`                 | Koa, not Next.js                     |
| `examples/server-app-access`                  | Server access patterns               |
| `examples/stagehand`                          | Browser automation, CLI              |
| `examples/manus`                              | Specialized tool, CLI                |
| `examples/dane`                               | Specialized tool, CLI                |
| `examples/unified-workspace`                  | Workspace config                     |
| `examples/yc-directory`                       | Data scraping, CLI                   |
| `examples/ai-beats-lab`                       | README only, no source               |
| `examples/voice`                              | Node.js voice demo                   |

---

## Adding a New Example

1. Find the closest GitHub example above as a reference
2. Create the tool in `src/mastra/tools/`
3. Create the agent in `src/mastra/agents/`
4. Register both in `src/mastra/index.ts`
5. Add API route at `src/app/api/[name]/route.ts`
6. Build the page at `src/app/[name]/page.tsx`
7. Update `src/app/page.tsx` — flip `status: 'soon'` → `status: 'live'`
8. Move this entry from "Coming Soon" to "Built" above
