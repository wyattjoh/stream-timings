import { z } from "zod";
import { measure, type StreamTimingReport } from "@wyattjoh/stream-utils";

const schema = z.object({
  url: z.string().min(1).url(),
});

export async function POST(req: Request): Promise<Response> {
  // Parse the url from the POST body.
  const { url } = schema.parse(await req.json());

  try {
    const stream = await measure(url);

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error fetching stream", err);

    if (err instanceof Error) {
      return new Response(
        JSON.stringify({
          type: "error",
          delta: 0,
          timing: 0,
          data: {
            message: err.message,
          },
        } satisfies StreamTimingReport),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        type: "error",
        delta: 0,
        timing: 0,
        data: {
          message: "Unknown error",
        },
      } satisfies StreamTimingReport),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
