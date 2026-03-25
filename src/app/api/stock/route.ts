import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/mastra';
import { NextResponse } from 'next/server';

const THREAD_ID = 'stock-thread-id';
const RESOURCE_ID = 'stock-chat';

export async function POST(req: Request) {
  try {
    const params = await req.json();
    const stream = await handleChatStream({
      mastra,
      agentId: 'stock-agent',
      params: {
        ...params,
        memory: {
          ...params.memory,
          thread: THREAD_ID,
          resource: RESOURCE_ID,
        },
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error('[stock POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const memory = await mastra.getAgentById('stock-agent').getMemory();
  let response = null;

  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    });
  } catch {
    console.log('No previous stock messages found.');
  }

  const uiMessages = toAISdkV5Messages(response?.messages || []);

  return NextResponse.json(uiMessages);
}
