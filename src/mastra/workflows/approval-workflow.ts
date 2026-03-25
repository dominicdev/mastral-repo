import { createStep, createWorkflow } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

// Inline agent — no need to register separately
const contentAgent = new Agent({
  id: 'content-draft-agent',
  instructions: `You are a skilled content writer.
  When drafting: write engaging, well-structured articles with a clear intro, body, and conclusion.
  When polishing: improve clarity, flow, and style while keeping the core message intact.`,
  model: 'google/gemini-2.5-pro',
});

// ─────────────────────────────────────────────
// Step 1 — Generate draft
// ─────────────────────────────────────────────
const generateDraftStep = createStep({
  id: 'generate-draft',
  description: 'AI generates a draft article for the given topic',
  inputSchema: z.object({
    topic: z.string().describe('The topic to write about'),
  }),
  outputSchema: z.object({
    title: z.string(),
    draft: z.string(),
  }),
  execute: async ({ inputData }) => {
    const result = await contentAgent.generate(
      `Write a concise blog post draft (250–350 words) about: "${inputData.topic}".
Respond with ONLY a raw JSON object (no markdown fences):
{ "title": "...", "draft": "..." }`
    );

    try {
      const cleaned = result.text.replace(/```(?:json)?\n?|```/g, '').trim();
      const json = JSON.parse(cleaned);
      return { title: String(json.title), draft: String(json.draft) };
    } catch {
      const lines = result.text.split('\n').filter(Boolean);
      return {
        title: lines[0].replace(/^#+\s*/, '').trim(),
        draft: result.text.trim(),
      };
    }
  },
});

// ─────────────────────────────────────────────
// Step 2 — Human review (suspends here)
// ─────────────────────────────────────────────
const humanReviewStep = createStep({
  id: 'human-review',
  description: 'Pauses workflow and waits for human approval',
  inputSchema: z.object({
    title: z.string(),
    draft: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional(),
    title: z.string(),
    draft: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional(),
  }),
  suspendSchema: z.object({
    title: z.string(),
    draft: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    // First pass — suspend and wait
    if (!resumeData) {
      return await suspend({ title: inputData.title, draft: inputData.draft });
    }
    // Resumed — pass everything forward
    return {
      approved: resumeData.approved,
      notes: resumeData.notes,
      title: inputData.title,
      draft: inputData.draft,
    };
  },
});

// ─────────────────────────────────────────────
// Step 3 — Finalize or reject
// ─────────────────────────────────────────────
const finalizeStep = createStep({
  id: 'finalize-content',
  description: 'Polishes approved content, or records rejection',
  inputSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional(),
    title: z.string(),
    draft: z.string(),
  }),
  outputSchema: z.object({
    status: z.enum(['published', 'rejected']),
    title: z.string(),
    content: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.approved) {
      return {
        status: 'rejected' as const,
        title: inputData.title,
        content: inputData.notes || 'No feedback provided.',
      };
    }

    const feedback = inputData.notes
      ? `\n\nApply this reviewer feedback: ${inputData.notes}`
      : '';

    const result = await contentAgent.generate(
      `Polish and improve this blog post draft.${feedback}

Title: ${inputData.title}

Draft:
${inputData.draft}

Return only the polished article text — no JSON, no preamble, no explanations.`
    );

    return {
      status: 'published' as const,
      title: inputData.title,
      content: result.text.trim(),
    };
  },
});

// ─────────────────────────────────────────────
// Workflow
// ─────────────────────────────────────────────
export const approvalWorkflow = createWorkflow({
  id: 'approval-workflow',
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    status: z.enum(['published', 'rejected']),
    title: z.string(),
    content: z.string(),
  }),
})
  .then(generateDraftStep)
  .then(humanReviewStep)
  .then(finalizeStep)
  .commit();
