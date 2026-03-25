import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/mastra';
import { NextResponse } from 'next/server';

const THREAD_ID = 'crypto-session';
const RESOURCE_ID = 'crypto-user';

export async function POST(req: Request) {
  const params = await req.json();
  const stream = await handleChatStream({
    mastra,
    agentId: 'crypto-agent',
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
}

export async function GET() {
  const memory = await mastra.getAgentById('crypto-agent').getMemory();
  let response = null;
  try {
    response = await memory?.recall({ threadId: THREAD_ID, resourceId: RESOURCE_ID });
  } catch {
    // no previous messages
  }
  const uiMessages = toAISdkV5Messages(response?.messages || []);
  return NextResponse.json(uiMessages);
}
