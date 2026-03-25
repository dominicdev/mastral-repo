'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  GitBranchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CircleDotIcon,
  LoaderIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  RefreshCwIcon,
  FileTextIcon,
  SparklesIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | { name: 'idle' }
  | { name: 'running'; step: 1 | 3; label: string }
  | { name: 'suspended'; runId: string; title: string; draft: string }
  | { name: 'resuming'; runId: string; decision: 'approved' | 'rejected' }
  | { name: 'completed'; title: string; content: string }
  | { name: 'rejected'; title: string; notes: string }
  | { name: 'error'; message: string }

type StepStatus = 'pending' | 'active' | 'suspended' | 'done' | 'rejected'

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Generate Draft', icon: SparklesIcon },
  { id: 2, label: 'Human Review', icon: ClockIcon },
  { id: 3, label: 'Finalize', icon: FileTextIcon },
]

function getStepStatus(stepId: number, phase: Phase): StepStatus {
  if (phase.name === 'idle') return 'pending'
  if (phase.name === 'running') {
    if (phase.step > stepId) return 'done'
    if (phase.step === stepId) return 'active'
    return 'pending'
  }
  if (phase.name === 'suspended') {
    if (stepId === 1) return 'done'
    if (stepId === 2) return 'suspended'
    return 'pending'
  }
  if (phase.name === 'resuming') {
    if (stepId <= 2) return 'done'
    return 'active'
  }
  if (phase.name === 'completed') return 'done'
  if (phase.name === 'rejected') {
    if (stepId <= 2) return 'rejected'
    return 'pending'
  }
  return 'pending'
}

function StepIndicator({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const status = getStepStatus(step.id, phase)
        const Icon = step.icon

        const iconEl =
          status === 'active' ? (
            <LoaderIcon className="h-5 w-5 animate-spin text-pink-500" />
          ) : status === 'done' ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
          ) : status === 'suspended' ? (
            <CircleDotIcon className="h-5 w-5 text-amber-500" />
          ) : status === 'rejected' ? (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground" />
          )

        const labelColor =
          status === 'active'
            ? 'text-pink-500 font-semibold'
            : status === 'done'
              ? 'text-emerald-600 font-medium'
              : status === 'suspended'
                ? 'text-amber-500 font-semibold'
                : status === 'rejected'
                  ? 'text-red-500 font-medium'
                  : 'text-muted-foreground'

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 px-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                  status === 'active'
                    ? 'border-pink-500 bg-pink-500/10'
                    : status === 'done'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : status === 'suspended'
                        ? 'border-amber-500 bg-amber-500/10'
                        : status === 'rejected'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border bg-muted/30'
                }`}
              >
                {iconEl}
              </div>
              <span className={`text-xs ${labelColor}`}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-16 transition-all ${
                  getStepStatus(step.id, phase) === 'done' ? 'bg-emerald-500/50' : 'bg-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Example topics ───────────────────────────────────────────────────────────

const EXAMPLES = [
  'The rise of AI in everyday life',
  'Why TypeScript is taking over JavaScript',
  'Beginner\'s guide to machine learning',
  'How to build better habits with small changes',
  'The future of remote work',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setPhase({ name: 'idle' })
    setTopic('')
    setNotes('')
  }

  // Start workflow
  const handleStart = async (t?: string) => {
    const value = (t ?? topic).trim()
    if (!value) return
    setPhase({ name: 'running', step: 1, label: 'Generating draft…' })

    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: value }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to start')

      if (data.status === 'suspended' && data.suspendPayload) {
        setPhase({
          name: 'suspended',
          runId: data.runId,
          title: data.suspendPayload.title,
          draft: data.suspendPayload.draft,
        })
      } else {
        setPhase({ name: 'error', message: 'Unexpected workflow state: ' + data.status })
      }
    } catch (err) {
      setPhase({ name: 'error', message: String(err) })
    }
  }

  // Resume workflow
  const handleDecision = async (approved: boolean) => {
    if (phase.name !== 'suspended') return
    const { runId, title, draft } = phase

    setPhase({ name: 'resuming', runId, decision: approved ? 'approved' : 'rejected' })

    try {
      const res = await fetch('/api/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, approved, notes: notes.trim() || undefined }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Resume failed')

      if (data.status === 'success' && data.result) {
        if (data.result.status === 'published') {
          setPhase({ name: 'completed', title: data.result.title, content: data.result.content })
        } else {
          setPhase({ name: 'rejected', title: title, notes: notes || 'No feedback provided.' })
        }
      } else if (approved) {
        setPhase({ name: 'completed', title, content: draft })
      } else {
        setPhase({ name: 'rejected', title, notes: notes || 'No feedback provided.' })
      }
    } catch (err) {
      setPhase({ name: 'error', message: String(err) })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-10 py-6">
        <div className="mx-auto flex max-w-4xl items-center gap-5">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-pink-500/40 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10">
            <GitBranchIcon className="h-8 w-8 text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Workflow with Suspend &amp; Resume</h1>
            <p className="text-base text-muted-foreground">Human-in-the-loop content publishing pipeline</p>
          </div>
        </div>
      </header>

      {/* Step progress */}
      <div className="border-b border-border bg-card/50 py-6">
        <div className="mx-auto flex max-w-4xl justify-center">
          <StepIndicator phase={phase} />
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-10 py-12">

        {/* ── IDLE ─────────────────────────────────────────────────────── */}
        {phase.name === 'idle' && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="mb-2 text-2xl font-bold text-foreground">Start a new workflow</h2>
              <p className="mb-6 text-muted-foreground">
                Enter a blog post topic. The AI will generate a draft, then pause for your review
                before finalizing.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="e.g. The rise of AI in everyday life"
                  className="flex-1 rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
                <button
                  onClick={() => handleStart()}
                  disabled={!topic.trim()}
                  className="rounded-xl bg-pink-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-40"
                >
                  Start
                </button>
              </div>
            </div>

            {/* Example topics */}
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => { setTopic(ex); handleStart(ex) }}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-pink-500/40 hover:bg-pink-500/5"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-border bg-card p-7">
              <h3 className="mb-4 text-base font-semibold text-foreground">How it works</h3>
              <div className="space-y-3">
                {[
                  { n: '1', color: 'bg-pink-500/10 text-pink-500', text: 'You submit a topic — Mastra starts a workflow run' },
                  { n: '2', color: 'bg-amber-500/10 text-amber-500', text: 'Step 1 runs: AI generates a draft article (workflow continues)' },
                  { n: '3', color: 'bg-amber-500/10 text-amber-500', text: 'Step 2 suspends: workflow pauses and waits for your decision' },
                  { n: '4', color: 'bg-emerald-500/10 text-emerald-600', text: 'You approve (optionally with notes) or reject — workflow resumes' },
                  { n: '5', color: 'bg-emerald-500/10 text-emerald-600', text: 'Step 3 runs: AI polishes the approved draft and publishes' },
                ].map(item => (
                  <div key={item.n} className="flex items-start gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.color}`}>
                      {item.n}
                    </span>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RUNNING step 1 or 3 ──────────────────────────────────────── */}
        {phase.name === 'running' && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-500/10">
              <LoaderIcon className="h-10 w-10 animate-spin text-pink-500" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">{phase.label}</p>
              <p className="mt-1 text-muted-foreground">
                {phase.step === 1
                  ? 'Gemini is drafting your article…'
                  : 'Polishing and finalizing your content…'}
              </p>
            </div>
          </div>
        )}

        {/* ── SUSPENDED — human review ─────────────────────────────────── */}
        {phase.name === 'suspended' && (
          <div className="space-y-6">
            {/* Review banner */}
            <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <CircleDotIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-foreground">Workflow paused — your review needed</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The AI has drafted an article. Review it below and approve to continue, or reject to stop.
                </p>
              </div>
            </div>

            {/* Draft display */}
            <div className="rounded-2xl border border-border bg-card p-7">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Generated Draft
              </h2>
              <h3 className="mb-5 text-2xl font-bold text-foreground">{phase.title}</h3>
              <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-base leading-relaxed text-foreground">
                {phase.draft}
              </div>
            </div>

            {/* Feedback */}
            <div className="rounded-2xl border border-border bg-card p-7">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Feedback / revision notes{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Make the tone more casual, add a section about costs…"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-none"
              />
            </div>

            {/* Decision buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleDecision(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <ThumbsUpIcon className="h-5 w-5" />
                Approve &amp; Publish
              </button>
              <button
                onClick={() => handleDecision(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-7 py-4 text-base font-semibold text-red-600 transition-colors hover:bg-red-500/20"
              >
                <ThumbsDownIcon className="h-5 w-5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* ── RESUMING ─────────────────────────────────────────────────── */}
        {phase.name === 'resuming' && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl ${
                phase.decision === 'approved' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}
            >
              <LoaderIcon
                className={`h-10 w-10 animate-spin ${
                  phase.decision === 'approved' ? 'text-emerald-500' : 'text-red-500'
                }`}
              />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                {phase.decision === 'approved' ? 'Finalizing your content…' : 'Recording rejection…'}
              </p>
              <p className="mt-1 text-muted-foreground">Workflow resumed — running step 3</p>
            </div>
          </div>
        )}

        {/* ── COMPLETED ────────────────────────────────────────────────── */}
        {phase.name === 'completed' && (
          <div className="space-y-6">
            {/* Success banner */}
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
              <div>
                <p className="font-semibold text-foreground">Workflow complete — content published!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  All 3 steps ran successfully. The draft was approved, polished, and published.
                </p>
              </div>
            </div>

            {/* Published content */}
            <div className="rounded-2xl border border-border bg-card p-7">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-600">
                Published Article
              </h2>
              <h3 className="mb-5 text-2xl font-bold text-foreground">{phase.title}</h3>
              <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                {phase.content}
              </div>
            </div>

            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Start new workflow
            </button>
          </div>
        )}

        {/* ── REJECTED ─────────────────────────────────────────────────── */}
        {phase.name === 'rejected' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <XCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold text-foreground">Workflow stopped — draft rejected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You rejected the draft for &ldquo;{phase.title}&rdquo;. The workflow did not proceed to step 3.
                </p>
              </div>
            </div>
            {phase.notes && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Your Feedback
                </p>
                <p className="text-base text-foreground">{phase.notes}</p>
              </div>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Start new workflow
            </button>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────── */}
        {phase.name === 'error' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="font-semibold text-foreground">Something went wrong</p>
              <p className="mt-1 text-sm text-red-600">{phase.message}</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
