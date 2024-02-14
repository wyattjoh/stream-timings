import { StreamReport, StreamTimingReport } from "@/types";
import { encode } from "./encoding";

class Reporter {
  private readonly start: number = performance.now();
  private last: number | null = null;

  public encode(report: StreamReport): string {
    const now = performance.now();

    const timing = now - this.start;

    // If this is the first report, set the last time to now.
    if (this.last === null) {
      this.last = now;
    }

    const delta = now - this.last;

    this.last = now;

    return encode({
      timing,
      delta,
      ...report,
    } satisfies StreamTimingReport);
  }
}

type MeasureOptions = {
  compress?: "gzip" | "br";
};

export async function measure(
  url: string,
  options?: MeasureOptions
): Promise<ReadableStream<Uint8Array>> {
  const reporter = new Reporter();

  const init: RequestInit = {
    headers: {
      // If the user has requested that the response be compressed, set the
      // Accept-Encoding header to the given value.
      "Accept-Encoding": options?.compress ? options.compress : "identity",
    },
  };

  // Start the underling fetch to the given URL.
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new Error("Could not fetch", { cause: err });
  }

  if (!res.body) {
    throw new Error("No body found in response");
  }

  // Create the transform stream that will append the timing data to the
  // chunk of data as it is being read. We'll decode each of the chunks
  // as a string, add the timing data, and re-encode it as a JSON string so
  // that it can be sent to the client.
  const decoder = new TextDecoderStream();
  const encoder = new TextEncoderStream();
  const transformer = new TransformStream<string, string>({
    start(controller) {
      controller.enqueue(
        reporter.encode({
          type: "start",
          data: {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
          },
        })
      );
    },
    transform(chunk, controller) {
      controller.enqueue(reporter.encode({ type: "chunk", data: { chunk } }));
    },
    flush(controller) {
      controller.enqueue(reporter.encode({ type: "end" }));
    },
  });

  // Pipe the response body through the transform stream and return the result.
  return res.body
    .pipeThrough(decoder)
    .pipeThrough(transformer)
    .pipeThrough(encoder);
}
