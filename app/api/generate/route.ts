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

    console.log(`[Batch Generate] Received request with ${tasks.length} tasks. Global Model: ${globalModel}`);

    if (!apiUrl || !apiKey) {
      console.error('[Batch Generate] Missing configuration');
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    const endpoint = apiUrl.endsWith('/v1/chat/completions')
      ? apiUrl
      : `${apiUrl.replace(/\/+$/, '')}/v1/chat/completions`;

    console.log(`[Batch Generate] Upstream Endpoint: ${endpoint}`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const processTask = async (task: Task, index: number) => {
          const currentModel = task.model || globalModel;
          console.log(`[Task ${index}] Starting. Model: ${currentModel}, Prompt: ${task.prompt.substring(0, 50)}...`);

          try {
            // Notify start of task
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  taskId: index,
                  status: 'pending',
                  message: 'Starting generation...',
                })}\n\n`
              )
            );

            const requestBody = {
              model: currentModel,
              messages: [{ role: 'user', content: task.prompt }],
              stream: true,
            };
            
            console.log(`[Task ${index}] Sending request to upstream...`);

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(requestBody),
            });

            console.log(`[Task ${index}] Upstream response status: ${response.status}`);

            if (!response.ok) {
              throw new Error(`Upstream API error: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let chunkCount = 0;

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
                      chunkCount++;
                      
                      // Log first chunk to verify data flow
                      if (chunkCount === 1) {
                         console.log(`[Task ${index}] Received first content chunk: ${content.substring(0, 20)}...`);
                      }

                      // Stream partial content update
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            taskId: index,
                            status: 'processing',
                            content: content,
                          })}\n\n`
                        )
                      );
                    }
                  } catch (e) {
                    console.error(`[Task ${index}] Error parsing chunk:`, e);
                  }
                }
              }
            }

            console.log(`[Task ${index}] Stream finished. Total accumulated content length: ${accumulatedContent.length}`);

            // Task completed, try to extract URL if possible, otherwise send full content
            const urlMatch = accumulatedContent.match(/https?:\/\/[^\s)]+/);
            let resultUrl = urlMatch ? urlMatch[0] : accumulatedContent;

            // Remove surrounding quotes if present
            resultUrl = resultUrl.replace(/^['"]|['"]$/g, '');

            console.log(`[Task ${index}] Final Result URL/Content: ${resultUrl}...`);

            // Check for error messages in the content
            const errorKeywords = ["生成失败", "violate", "error", "failed", "rejected"];
            const isError = errorKeywords.some(keyword => resultUrl.toLowerCase().includes(keyword.toLowerCase()));

            if (isError) {
                console.warn(`[Task ${index}] Detected error in content, marking as failed.`);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      taskId: index,
                      status: 'failed',
                      error: resultUrl, // Send the content as the error message
                    })}\n\n`
                  )
                );
            } else {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      taskId: index,
                      status: 'success',
                      result: resultUrl,
                    })}\n\n`
                  )
                );
            }

          } catch (error) {
            console.error(`[Task ${index}] Failed:`, error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  taskId: index,
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`
              )
            );
          }
        };

        // Execute all tasks concurrently
        await Promise.all(tasks.map((task, index) => processTask(task, index)));
        
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