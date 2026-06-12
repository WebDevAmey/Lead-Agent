import { getAgentState } from "@/lib/agent-runner";

export async function GET() {
  const state = getAgentState();
  const encoder = new TextEncoder();
  let listener: (chunk: string) => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 2000\n\n"));
      listener = (text: string) => {
        const payload = text
          .split("\n")
          .map((line) => `data: ${line}`)
          .join("\n");
        controller.enqueue(encoder.encode(payload + "\n\n"));
      };
      state.listeners.add(listener);
    },
    cancel() {
      state.listeners.delete(listener);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
