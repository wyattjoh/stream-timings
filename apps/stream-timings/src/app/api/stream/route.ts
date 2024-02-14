import {
  encode,
  measure,
  type StreamTimingReport,
} from "@wyattjoh/stream-utils";
import { schema } from "@/lib/shared";

export async function POST(req: Request): Promise<Response> {
  try {
    const { url, compress } = schema.parse(await req.json());

    // Measure the stream timing for the given URL.
    const stream = await measure(url, {
      headers: {
        "Accept-Encoding": compress,
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error fetching stream", err);

    const message = err instanceof Error ? err.message : "Unknown error";

    const report: StreamTimingReport = {
      type: "error",
      delta: 0,
      timing: 0,
      data: { message },
    };

    return new Response(encode(report), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
