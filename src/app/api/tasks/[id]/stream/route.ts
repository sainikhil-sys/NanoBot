import { NextRequest } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { taskEventBroker } from "@/lib/orchestration/execution-engine";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await context.params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial state and all past events
      const task = await DbService.getTask(taskId);
      if (task) {
        controller.enqueue(
          encoder.encode(`event: init\ndata: ${JSON.stringify(task)}\n\n`)
        );
      }

      // 2. Subscribe to live broker events
      const unsubscribe = taskEventBroker.subscribe(taskId, async (event) => {
        try {
          const updatedTask = await DbService.getTask(taskId);
          controller.enqueue(
            encoder.encode(
              `event: task_event\ndata: ${JSON.stringify({ event, task: updatedTask })}\n\n`
            )
          );

          if (event.event_type === "TASK_COMPLETED" || event.event_type === "TASK_FAILED") {
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // ignore
              }
            }, 1000);
          }
        } catch (e) {
          console.error("Error streaming task event", e);
        }
      });

      // Keepalive ping interval
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
