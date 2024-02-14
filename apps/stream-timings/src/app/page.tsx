"use client";

import type { RequestBody } from "./api/stream/route";
import clsx from "clsx";
import { type StreamTimingReport, decode } from "@wyattjoh/stream-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  url: z.string().min(1).url(),
  compress: z.enum(["gzip", "br", ""]),
});

type FormFields = z.infer<typeof schema>;

export default function Page() {
  const form = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<StreamTimingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<AbortController | null>(null);

  const onSubmit = useCallback(async ({ url, compress }: FormFields) => {
    setError(null);

    // Abort the previous request if it exists.
    if (ref.current) ref.current.abort();
    const controller = new AbortController();
    ref.current = controller;

    // Reset the elements.
    setReports([]);
    setLoading(true);

    // Compile the body of the request.
    const body: RequestBody = { url };
    if (compress) {
      body.compress = compress;
    }

    try {
      const res = await fetch("/api/stream", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.body) return;

      const decoder = new TextDecoderStream();
      const writer = new WritableStream<string>({
        write(chunk) {
          const parsed = decode(chunk);
          if (parsed.length === 0) return;

          setReports((prev) => [...prev, ...parsed]);
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
  }, []);

  return (
    <div className="font-mono flex flex-col h-full">
      <div className="max-w-[800px] mx-auto px-4 space-y-4 py-6">
        <div>
          <h1 className="text-3xl font-semibold">Stream Timings Profiler</h1>
          <div>
            <a
              href="https://github.com/wyattjoh/stream-timings"
              className="underline text-sm text-gray-600"
            >
              https://github.com/wyattjoh/stream-timings
            </a>
          </div>
        </div>
        <p>
          This tool generates stream timing profiles for a given URL. It does
          this by making a request to the URL and then parsing the stream
          timings from the server. By configuring the compression, the request
          will be made with the given compression algorithm via the{" "}
          <code className="bg-slate-100 p-1">Accept-Encoding</code> header.
        </p>
        <form
          className="flex flex-col space-y-2 w-full"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex space-x-2">
            <div className="flex-grow flex flex-col space-y-2">
              <input
                type="url"
                placeholder="URL"
                className="border p-2 text-sm rounded-md dark:text-slate-800"
                {...form.register("url")}
              />
              <FieldError message={form.formState.errors.url?.message} />
            </div>
            <button
              type="submit"
              className="px-3 py-2 font-semibold text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 aria-disabled:bg-gray-400 aria-disabled:cursor-not-allowed"
              aria-disabled={loading}
            >
              {loading ? "Profiling..." : "Profile URL"}
            </button>
          </div>
          <div className="p-2 text-xs flex space-x-2 items-center">
            <label className="" htmlFor="compress">
              Compression
            </label>
            <select
              className="p-2 rounded-md bg-slate-100 hover:bg-slate-200"
              {...form.register("compress")}
            >
              <option value="">None</option>
              <option value="gzip">gzip</option>
              <option value="br">brotli</option>
            </select>
          </div>
        </form>
        {error && <div className="text-red-500">{error}</div>}
      </div>
      <div className="flex-grow bg-slate-200 border-t-2 border-slate-300">
        <div className="max-w-[800px] mx-auto space-y-4 my-6">
          {reports.length > 0 && <ReportSummary reports={reports} />}
          {reports.map((report, index) => {
            return <Report key={index} report={report} />;
          })}
        </div>
      </div>
    </div>
  );
}

type Summary = {
  headers: number | null;
  chunks: number | null;
  total: number | null;
};

function Loading() {
  return <span className="animate-pulse">Loading...</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-white bg-red-500 p-1 text-xs">{message}</p>;
}

function ReportSummary({ reports }: { reports: StreamTimingReport[] }) {
  const summary = useMemo(() => {
    return reports.reduce<Summary>(
      (acc, report) => {
        switch (report.type) {
          case "start":
            acc.headers = report.timing;
            break;
          case "chunk":
            acc.chunks = (acc.chunks || 0) + 1;
            break;
          case "end":
            acc.total = report.timing;
            break;
        }

        return acc;
      },
      {
        headers: null,
        chunks: null,
        total: null,
      }
    );
  }, [reports]);

  return (
    <div className="grid md:grid-cols-3 bg-gray-600 text-gray-200 p-3 rounded-md text-sm">
      <div>
        <span className="text-indigo-300">End of Headers</span>:{" "}
        {summary.headers !== null ? (
          summary.headers.toFixed(2) + "ms"
        ) : (
          <Loading />
        )}
      </div>
      <div>
        <span className="text-indigo-300">Chunk Count</span>:{" "}
        {summary.chunks !== null && summary.total !== null ? (
          summary.chunks
        ) : (
          <Loading />
        )}
      </div>
      <div>
        <span className="text-indigo-300">Total Time</span>:{" "}
        {summary.total !== null ? summary.total.toFixed(2) + "ms" : <Loading />}
      </div>
    </div>
  );
}

const ReportName: Record<StreamTimingReport["type"], string> = {
  start: "Headers",
  chunk: "Data",
  end: "Request End",
  error: "Error",
};

function Report({ report }: { report: StreamTimingReport }) {
  return (
    <div className="mb-2 border-y bg-white md:border dark:md:border-slate-600 dark:bg-slate-700 md:rounded-md p-2 space-y-2 md:shadow-sm">
      <div className="grid md:grid-cols-3">
        <span>{ReportName[report.type]}</span>
        <span>
          <span className="text-xs lowercase text-gray-500">Since Start</span>:{" "}
          {report.timing.toFixed(2)}ms
        </span>
        <span>
          <span className="text-xs lowercase text-gray-500">
            Since Previous
          </span>
          : {report.delta.toFixed(2)}ms
        </span>
      </div>
      <ReportDetail report={report} />
    </div>
  );
}

function ReportDetail({ report }: { report: StreamTimingReport }) {
  if (report.type === "end") {
    return null;
  }

  const className =
    report.type !== "error"
      ? "text-xs text-gray-200 bg-gray-600 p-2 rounded-md"
      : "text-sm text-white bg-red-600 p-2 rounded-md";

  if (report.type === "start") {
    return (
      <div className={className}>
        <div className="text-indigo-300">
          HTTP/1.1 {report.data.status} {report.data.statusText}
        </div>
        <ul>
          {Object.entries(report.data.headers).map(([key, value]) => {
            return (
              <li key={key}>
                <span className="capitalize text-indigo-300">{key}</span>:{" "}
                {value}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (report.type === "chunk") {
    return (
      <pre className={clsx(className, "whitespace-break-spaces break-words")}>
        {report.data.chunk}
      </pre>
    );
  }

  if (report.type === "error") {
    return <pre className={className}>Error: {report.data.message}</pre>;
  }

  return null;
}
