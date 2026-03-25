# Mastra + Next.js Setup Guide

## Prerequisites

- Node.js 22.13.0 or higher
- npm or pnpm
- A Google AI account (for Gemini models)
- A Mastra Cloud account (optional but recommended)

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Your `.env` file needs these variables:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
MASTRA_CLOUD_ACCESS_TOKEN=your_mastra_cloud_token_here   # optional
```

---

## 3. Get Your Google Generative AI API Key

This project uses **Gemini 2.5 Pro** for all agents. You need a Google AI API key.

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key and paste it into `.env`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...
   ```

> Free tier includes generous limits. No credit card required to start.

---

## 4. Get Your Mastra Cloud Access Token

Mastra Cloud stores traces, observability data, and lets you use Mastra Studio remotely.
**This is optional** — the app works without it (you'll just see a warning in the console).

### Steps

1. Go to [https://cloud.mastra.ai](https://cloud.mastra.ai)
2. Sign up or log in
3. Create a new **Project** (e.g. `my-nextjs-agent`)
4. In the project dashboard, go to **Settings** → **API Keys**
5. Click **"Generate Access Token"**
6. Copy the token and paste it into `.env`:
   ```
   MASTRA_CLOUD_ACCESS_TOKEN=eyJhbGci...
   ```

### What it does

- Sends traces to Mastra Cloud so you can inspect every agent call
- Powers the **Mastra Studio** UI at `http://localhost:4111`
- Enables scoring and evaluation dashboards

### If you skip this

You'll see this warning in the console — it's safe to ignore:
```
mastra-cloud-observability-exporter disabled: MASTRA_CLOUD_ACCESS_TOKEN not set
```

---

## 5. Run the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 6. (Optional) Run Mastra Studio

Mastra Studio is a local dashboard to inspect agents, traces, and memory.

Open a second terminal and run:

```bash
# Inside the mastra project (if separate) or same project
npx mastra dev
```

Studio runs at **http://localhost:4111**

---

## 7. Available Pages

| Route | Description |
|-------|-------------|
| `/` | Home — navigation hub |
| `/chat` | Mastra Assistant — general AI chat with memory |
| `/stock` | Stock Price Tracker — live quotes via Yahoo Finance |
| `/image` | Image Analyzer — vision AI for objects, animals, scenes |
| `/excalidraw` | Image to Excalidraw — convert diagrams to editable JSON |
| `/voice` | Voice Agent — speak and get spoken responses (Chrome/Edge only) |
| `/supervisor` | Supervisor Agent — multi-agent orchestration |
| `/workflow` | Workflow Suspend & Resume — human-in-the-loop pipeline |
| `/crypto` | Crypto Analyst — live prices + 24h AI outlook |

---

## 8. Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/                # Backend API routes
│   ├── chat/               # Chat page
│   ├── stock/              # Stock tracker page
│   ├── image/              # Image analyzer page
│   ├── excalidraw/         # Excalidraw converter page
│   ├── voice/              # Voice agent page
│   ├── supervisor/         # Multi-agent supervisor page
│   ├── workflow/           # Workflow suspend/resume page
│   └── crypto/             # Crypto analyst page
├── mastra/
│   ├── agents/             # All agent definitions
│   ├── tools/              # Custom tools (stock, crypto, etc.)
│   ├── workflows/          # Workflow definitions
│   └── index.ts            # Mastra instance + registration
└── components/
    ├── ai-elements/        # Chat UI components
    └── ui/                 # shadcn/ui components
```

---

## 9. Adding a New Agent

1. Create `src/mastra/agents/my-agent.ts`
2. Register it in `src/mastra/index.ts`
3. Create an API route at `src/app/api/my-route/route.ts`
4. Build the page at `src/app/my-page/page.tsx`
5. Add a card in `src/app/page.tsx`

---

## Troubleshooting

**"Coin not found" or API errors**
- CoinGecko free API has rate limits — wait a few seconds and retry

**"Workflow with ID not found"**
- Make sure the workflow is registered in `src/mastra/index.ts` using the correct object key

**Voice page not working**
- Speech Recognition only works in **Chrome** or **Edge** — not Firefox or Safari

**"append is not a function"**
- Use `sendMessage({ text })` from `useChat` — not `append`

**TypeScript errors after adding a new agent**
- Run `npm run build` to catch type errors early
