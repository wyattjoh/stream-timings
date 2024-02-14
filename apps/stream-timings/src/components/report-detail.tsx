import { cn } from "@/lib/cn";
import type { StreamTimingReport } from "@wyattjoh/stream-utils";

export function ReportDetail({ report }: { report: StreamTimingReport }) {
  if (report.type === "end") {
    return null;
  }

  const className =
    report.type !== "error"
      ? "text-xs text-gray-200 bg-slate-800 dark:bg-slate-900 p-2"
      : "text-sm text-white bg-red-600 p-2";

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
      <pre className={cn(className, "whitespace-break-spaces break-words")}>
        {report.data.chunk}
      </pre>
    );
  }

  if (report.type === "error") {
    return <pre className={className}>Error: {report.data.message}</pre>;
  }

  return null;
}
