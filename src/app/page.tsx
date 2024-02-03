"use client";

import clsx from "clsx";
import type { StreamTimingReport } from "@/types";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

function parseChunk(chunk: string): StreamTimingReport[] {
  // Split the chunk by newline, we may be getting multiple JSON
  // objects.
  const chunks = chunk
    .split("\n")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const reports: StreamTimingReport[] = [];

  for (const chunk of chunks) {
    try {
      reports.push(JSON.parse(chunk));
    } catch (err) {
      console.log("Could not parse JSON", chunk);
      console.error(err);
    }
  }

  return reports;
}

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const [url, setURL] = useState<string | null>(null);
  const [reports, setReports] = useState<StreamTimingReport[]>([]);
  const ref = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setURL(e.target.value);
  }, []);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!url) return;

      try {
        new URL(url);
      } catch (err) {
        setError("Invalid URL: " + url);
        return;
      }

      setError(null);

      // Abort the previous request if it exists.
      if (ref.current) ref.current.abort();
      ref.current = new AbortController();

      // Reset the elements.
      setReports([]);
      setLoading(true);

      fetch("/api/stream", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ url }),
        signal: ref.current.signal,
      })
        .then((res) => {
          if (!res.body) return;

          const decoder = new TextDecoderStream();
          const writer = new WritableStream<string>({
            write(chunk) {
              const parsed = parseChunk(chunk);
              if (parsed.length === 0) return;

              setReports((prev) => [...prev, ...parsed]);
            },
          });

          return res.body.pipeThrough(decoder).pipeTo(writer);
        })
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
        });
    },
    [url]
  );

  return (
    <div className="flex flex-col items-center my-6 font-mono">
      <div className="max-w-[800px] w-full">
        <h1 className="text-3xl font-semibold mb-4">Stream Timings Profiler</h1>
        <p className="mb-4">
          This tool generates stream timing profiles for a given URL. It does
          this by making a request to the URL and then parsing the stream
          timings from the server.
        </p>
        <form className="flex flex-col mb-6" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="URL"
            name="url"
            className="border mb-2 p-2 text-sm"
            onChange={onChange}
          />
          <div>
            <button
              type="submit"
              className="px-3 py-1 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 aria-disabled:bg-gray-400 aria-disabled:cursor-not-allowed"
              aria-disabled={loading}
            >
              {loading ? "Profiling..." : "Profile URL"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {reports.length > 0 && <ReportSummary reports={reports} />}
        <div>
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
    <div className="mb-4 grid grid-cols-3 bg-gray-600 text-gray-200 p-3 rounded-md text-md">
      <div>
        <span className="text-indigo-300">End of Headers</span>:{" "}
        {summary.headers !== null
          ? summary.headers.toFixed(2) + "ms"
          : "Loading..."}
      </div>
      <div>
        <span className="text-indigo-300">Chunk Count</span>:{" "}
        {summary.chunks !== null && summary.total !== null
          ? summary.chunks
          : "Loading..."}
      </div>
      <div>
        <span className="text-indigo-300">Total Time</span>:{" "}
        {summary.total !== null
          ? summary.total.toFixed(2) + "ms"
          : "Loading..."}
      </div>
    </div>
  );
}

const ReportName: Record<StreamTimingReport["type"], string> = {
  start: "Headers",
  chunk: "Data",
  end: "Request End",
};

function Report({ report }: { report: StreamTimingReport }) {
  return (
    <div className="mb-2 border rounded-md p-2 space-y-2 drop-shadow-md">
      <div className="grid grid-cols-3">
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

  const className = "text-xs text-gray-200 bg-gray-600 p-2";

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

  return null;
}
