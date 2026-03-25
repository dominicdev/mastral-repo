import { mastra } from '@/mastra';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // allow up to 60s for AI draft generation

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const workflow = mastra.getWorkflow('approvalWorkflow');
    const run = workflow.createRun();

    const result = await run.start({ inputData: { topic: topic.trim() } });

    if (result.status === 'suspended') {
      const suspendedStepId = result.suspended?.[0];
      const suspendPayload = suspendedStepId
        ? (result.steps[suspendedStepId] as { suspendPayload?: { title: string; draft: string } })?.suspendPayload
        : null;

      return NextResponse.json({
        runId: run.runId,
        status: 'suspended',
        suspendPayload,
      });
    }

    return NextResponse.json({
      runId: run.runId,
      status: result.status,
      result: result.result,
    });
  } catch (err) {
    console.error('Workflow start error:', err);
    return NextResponse.json({ error: 'Failed to start workflow' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { runId, approved, notes } = await req.json();
    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    const workflow = mastra.getWorkflow('approvalWorkflow');
    const run = workflow.createRun({ runId });

    const result = await run.resume({
      step: 'human-review',
      resumeData: { approved: Boolean(approved), notes: notes || undefined },
    });

    return NextResponse.json({
      status: result.status,
      result: result.result,
    });
  } catch (err) {
    console.error('Workflow resume error:', err);
    return NextResponse.json({ error: 'Failed to resume workflow' }, { status: 500 });
  }
}
