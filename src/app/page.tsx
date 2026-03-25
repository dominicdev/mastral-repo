import Link from 'next/link'
import {
  SparklesIcon,
  BarChart2Icon,
  CloudSunIcon,
  CodeIcon,
  CheckSquareIcon,
  GitBranchIcon,
  BrainCircuitIcon,
  FileTextIcon,
  ArrowRightIcon,
  ZapIcon,
  ScanSearchIcon,
  PencilRulerIcon,
  MicIcon,
  NetworkIcon,
} from 'lucide-react'

const EXAMPLES = [
  {
    category: 'Live',
    items: [
      {
        href: '/chat',
        icon: SparklesIcon,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-500',
        title: 'Mastra Assistant',
        description: 'A general-purpose AI assistant with tool use and persistent memory across sessions.',
        tags: ['Chat', 'Memory', 'Tools'],
        status: 'live' as const,
      },
      {
        href: '/stock',
        icon: BarChart2Icon,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        title: 'Stock Price Tracker',
        description: 'Ask for real-time stock quotes, daily changes, market cap, and 52-week ranges.',
        tags: ['Agent', 'Tool', 'Finance'],
        status: 'live' as const,
      },
      {
        href: '/image',
        icon: ScanSearchIcon,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-500',
        title: 'Image Analyzer',
        description: 'Upload or paste an image URL to identify birds, animals, vehicles, objects and more using Gemini Vision.',
        tags: ['Vision', 'Gemini', 'Detection'],
        status: 'live' as const,
      },
      {
        href: '/excalidraw',
        icon: PencilRulerIcon,
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-500',
        title: 'Image to Excalidraw',
        description: 'Convert any diagram, flowchart, or sketch into editable Excalidraw JSON using Gemini Vision.',
        tags: ['Vision', 'Gemini', 'Diagram'],
        status: 'live' as const,
      },
      {
        href: '/voice',
        icon: MicIcon,
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        title: 'Voice Agent',
        description: 'Talk to the AI with your microphone. Real-time speech recognition with spoken responses.',
        tags: ['Voice', 'STT', 'TTS'],
        status: 'live' as const,
      },
      {
        href: '/supervisor',
        icon: NetworkIcon,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-500',
        title: 'Supervisor Agent',
        description: 'A supervisor that delegates tasks to specialist sub-agents: Research, Writing, and Code.',
        tags: ['Multi-Agent', 'Orchestration', 'Delegation'],
        status: 'live' as const,
      },
      {
        href: '/workflow',
        icon: GitBranchIcon,
        iconBg: 'bg-pink-500/10',
        iconColor: 'text-pink-500',
        title: 'Workflow: Suspend & Resume',
        description: 'A content pipeline that pauses for human approval mid-execution, then resumes — human-in-the-loop.',
        tags: ['Workflow', 'Human-in-loop', 'Suspend'],
        status: 'live' as const,
      },
    ],
  },
  {
    category: 'Coming Soon',
    items: [
      {
        href: '#',
        icon: CloudSunIcon,
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-500',
        title: 'Weather Agent',
        description: 'Get current weather, forecasts, and activity suggestions for any city worldwide.',
        tags: ['Agent', 'Tool', 'Weather'],
        status: 'soon' as const,
      },
      {
        href: '#',
        icon: CodeIcon,
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-500',
        title: 'Code Assistant',
        description: 'Debug errors, view stack traces, and get code suggestions with syntax highlighting.',
        tags: ['Agent', 'Code', 'Stack Trace'],
        status: 'soon' as const,
      },
      {
        href: '#',
        icon: CheckSquareIcon,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        title: 'Todo Agent with Memory',
        description: 'Manage tasks with an AI agent that remembers your todos across sessions.',
        tags: ['Agent', 'Memory', 'Tasks'],
        status: 'soon' as const,
      },
      {
        href: '#',
        icon: GitBranchIcon,
        iconBg: 'bg-pink-500/10',
        iconColor: 'text-pink-500',
        title: 'Multi-step Workflow',
        description: 'Visualize step-by-step AI workflows with checkpoints, queues, and plans.',
        tags: ['Workflow', 'Plan', 'Steps'],
        status: 'soon' as const,
      },
      {
        href: '#',
        icon: BrainCircuitIcon,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        title: 'Agent Reasoning Viewer',
        description: 'Watch the agent think step-by-step with chain-of-thought and reasoning traces.',
        tags: ['Agent', 'Reasoning', 'CoT'],
        status: 'soon' as const,
      },
      {
        href: '#',
        icon: FileTextIcon,
        iconBg: 'bg-teal-500/10',
        iconColor: 'text-teal-500',
        title: 'Text to SQL',
        description: 'Ask questions in plain English and get SQL queries generated and explained.',
        tags: ['Agent', 'SQL', 'Database'],
        status: 'soon' as const,
      },
    ],
  },
]

const statusStyles = {
  live: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  soon: 'bg-muted text-muted-foreground border border-border',
}

const statusLabels = {
  live: 'Live',
  soon: 'Coming Soon',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <ZapIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mastra AI Examples</h1>
            <p className="text-sm text-muted-foreground">Next.js · TypeScript · Mastra Framework</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-card/50 px-10 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
              Component Showcase
            </p>
            <h2 className="mb-5 text-5xl font-bold leading-tight text-foreground">
              Build AI apps<br />with Mastra
            </h2>
            <p className="text-xl leading-relaxed text-muted-foreground">
              A collection of real-world examples showing how to build AI-powered
              interfaces using Mastra agents, tools, workflows, and memory.
            </p>
          </div>
        </div>
      </section>

      {/* Examples */}
      <main className="px-10 py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          {EXAMPLES.map(section => (
            <div key={section.category}>
              <div className="mb-7 flex items-center gap-4">
                <h3 className="text-2xl font-semibold text-foreground">{section.category}</h3>
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">{section.items.length} examples</span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map(example => {
                  const Icon = example.icon
                  const isLive = example.status === 'live'

                  const card = (
                    <div
                      className={`group relative flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-all duration-200 ${
                        isLive
                          ? 'cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                          : 'opacity-60'
                      }`}
                    >
                      {/* Icon + status */}
                      <div className="mb-5 flex items-start justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${example.iconBg}`}>
                          <Icon className={`h-7 w-7 ${example.iconColor}`} />
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[example.status]}`}>
                          {statusLabels[example.status]}
                        </span>
                      </div>

                      {/* Text */}
                      <h4 className="mb-2 text-lg font-semibold text-foreground">{example.title}</h4>
                      <p className="mb-5 flex-1 text-base leading-relaxed text-muted-foreground">
                        {example.description}
                      </p>

                      {/* Tags + arrow */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {example.tags.map(tag => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {isLive && (
                          <ArrowRightIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                        )}
                      </div>
                    </div>
                  )

                  return isLive ? (
                    <Link key={example.title} href={example.href} className="flex">
                      {card}
                    </Link>
                  ) : (
                    <div key={example.title} className="flex">
                      {card}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-10 py-8 mt-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Built with <span className="font-medium text-foreground">Mastra</span> · Next.js · shadcn/ui
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>

    </div>
  )
}
