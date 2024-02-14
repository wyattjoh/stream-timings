"use client";

import { type StreamTimingReport, decode } from "@wyattjoh/stream-utils";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Schema, schema } from "@/lib/shared";

const defaultValues: Schema = {
  url: "https://www.vercel.com",
  compress: "*",
};

type Props = {
  setReports: (
    dispatcher:
      | ((reports: ReadonlyArray<StreamTimingReport>) => StreamTimingReport[])
      | StreamTimingReport[]
  ) => void;
};

export function StreamForm({ setReports }: Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<AbortController | null>(null);
  const onSubmit = useCallback(
    async ({ url, compress }: Schema) => {
      setError(null);

      // Abort the previous request if it exists.
      if (ref.current) ref.current.abort();
      const controller = new AbortController();
      ref.current = controller;

      // Reset the elements.
      setReports([]);
      setLoading(true);

      try {
        const res = await fetch("/api/stream", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(
            // Compile the body of the request.
            { url, compress } satisfies Schema
          ),
          signal: controller.signal,
        });

        if (!res.body) return;

        const decoder = new TextDecoderStream();
        let buffer = "";
        const writer = new WritableStream<string>({
          write(chunk) {
            buffer += chunk;

            // If the buffer has a "\n" in it, then we can parse it.
            const lastIndexOf = buffer.lastIndexOf("\r\n");
            if (lastIndexOf === -1) return;

            const parsed = decode(buffer.slice(0, lastIndexOf));
            if (parsed.length === 0) {
              throw new Error("A stream timing report could not be parsed");
            }
            buffer = buffer.slice(lastIndexOf + 1);

            setReports((prev) => prev.concat(parsed));
          },
          close() {
            if (buffer.length === 0) return;

            const parsed = decode(buffer);
            if (parsed.length === 0) {
              throw new Error("A stream timing report could not be parsed");
            }

            setReports((prev) => prev.concat(parsed));
          },
        });

        await res.body.pipeThrough(decoder).pipeTo(writer);
      } catch (err) {
        console.error(err);

        const message = err instanceof Error ? err.message : null;
        setError(
          `An error occurred while profiling the URL.${
            message ? " " + message : ""
          }`
        );
      }

      // If the controller that was used to make the request is the same
      // as the one that is currently stored in the ref, then we can
      // clear it out as we're done with it.
      if (ref.current === controller) {
        ref.current = null;
      }

      // We're done loading.
      setLoading(false);
    },
    [setReports]
  );

  return (
    <form
      className="flex flex-col space-y-4 w-full"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <label
          htmlFor="url"
          className="text-xs text-gray-700 dark:text-slate-400"
        >
          Request URL
        </label>
        <div className="flex-grow flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <input
            type="url"
            id="url"
            placeholder="URL"
            defaultValue={defaultValues.url}
            className="border p-2 text-sm dark:text-slate-800  flex-grow"
            {...form.register("url")}
          />
          <button
            type="submit"
            className="px-3 py-2 font-semibold text-sm shadow text-white bg-indigo-500 hover:bg-indigo-400 aria-disabled:bg-gray-400 aria-disabled:cursor-not-allowed"
            aria-disabled={loading}
          >
            {loading ? "Profiling..." : "Profile URL"}
          </button>
        </div>
        <FieldError message={form.formState.errors.url?.message} />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-700 dark:text-slate-400">Headers</div>
        <div className="text-xs flex space-x-2 items-center bg-slate-100 dark:bg-slate-900 p-2">
          <label htmlFor="compress">Accept-Encoding:</label>
          <select
            id="compress"
            className="p-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            defaultValue={defaultValues.compress}
            {...form.register("compress")}
          >
            <option value="*">*</option>
            <option value="gzip">gzip</option>
            <option value="br">br</option>
          </select>
        </div>
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-white bg-red-500 p-1 text-xs">{message}</p>;
}
