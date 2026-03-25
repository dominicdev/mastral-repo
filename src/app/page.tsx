import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'

const EXAMPLES = [
  { href: '/chat',       title: 'Mastra Assistant',        description: 'General-purpose AI chat with memory' },
  { href: '/stock',      title: 'Stock Tracker',           description: 'Real-time stock prices and market data' },
  { href: '/crypto',     title: 'Crypto Analyst',          description: 'Crypto prices with AI-powered 24h outlook' },
  { href: '/image',      title: 'Image Analyzer',          description: 'Upload an image and identify what\'s in it' },
  { href: '/excalidraw', title: 'Image to Excalidraw',     description: 'Convert any diagram into editable Excalidraw' },
  { href: '/voice',      title: 'Voice Agent',             description: 'Talk to the AI with your microphone' },
  { href: '/supervisor', title: 'Supervisor Agent',        description: 'Delegates tasks to research, writing, and code agents' },
  { href: '/workflow',   title: 'Workflow: Approve',       description: 'AI drafts content, you approve, AI publishes' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">

        <h1 className="mb-2 text-3xl font-bold text-foreground">Mastra AI Examples</h1>
        <p className="mb-12 text-muted-foreground">Built with Mastra · Next.js · TypeScript</p>

        <ul className="space-y-1">
          {EXAMPLES.map(({ href, title, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted"
              >
                <div>
                  <span className="font-medium text-foreground">{title}</span>
                  <span className="ml-3 text-sm text-muted-foreground">{description}</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>

      </div>
    </div>
  )
}
