import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface Task {
  prompt: string;
  model?: string;
}

interface RequestBody {
  config: {
    apiUrl: string;
    apiKey: string;
  };
  globalModel: string;
  tasks: Task[];
}

export async function POST(req: Request) {
  try {
    const { config, globalModel, tasks } = (await req.json()) as RequestBody;
    const { apiUrl, apiKey } = config;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    const endpoint = apiUrl.endsWith('/v1/chat/completions')
      ? apiUrl
      : `${apiUrl.replace(/\/+$/, '')}/v1/chat/completions`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          const currentModel = task.model || globalModel;

          try {
            // Notify start of task
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  taskId: i,
                  status: 'pending',
                  message: 'Starting generation...',
                })}\n\n`
              )
            );

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'user', content: task.prompt }],
                stream: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`Upstream API error: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter((line) => line.trim() !== '');

              for (const line of lines) {
                if (line.includes('[DONE]')) continue;
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content || '';
                    if (content) {
                      accumulatedContent += content;
                      // Stream partial content update
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            taskId: i,
                            status: 'processing',
                            content: content,
                          })}\n\n`
                        )
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing chunk:', e);
                  }
                }
              }
            }

            // Task completed, try to extract URL if possible, otherwise send full content
            // Assuming the content itself is the result or contains the URL
            const urlMatch = accumulatedContent.match(/https?:\/\/[^\s)]+/);
            const resultUrl = urlMatch ? urlMatch[0] : accumulatedContent;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  taskId: i,
                  status: 'success',
                  result: resultUrl,
                })}\n\n`
              )
            );

          } catch (error) {
            console.error(`Task ${i} failed:`, error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  taskId: i,
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`
              )
            );
          }
        }
        
        // End of all tasks
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}