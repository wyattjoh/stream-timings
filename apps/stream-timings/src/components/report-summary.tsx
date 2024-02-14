import type { StreamTimingReport } from "@wyattjoh/stream-utils";
import type { Summary } from "./use-summary";
import styles from "./report-summary.module.css";
import { Card } from "./card";
import { CardDetail } from "./card-detail";
import { cn } from "@/lib/cn";

function Loading() {
  return <span className="animate-pulse">Loading...</span>;
}

type Props = {
  summary: Summary;
  reports: ReadonlyArray<StreamTimingReport>;
};

const colors: Record<StreamTimingReport["type"], string> = {
  start: "bg-indigo-500 hover:bg-indigo-600",
  chunk: "bg-emerald-500 hover:bg-emerald-600",
  end: "bg-yellow-500 hover:bg-yellow-600",
  error: "bg-red-500 hover:bg-red-600",
};

const names: Record<StreamTimingReport["type"], string> = {
  start: "Headers",
  chunk: "Data Chunk",
  end: "End of Request",
  error: "Error",
};

const order: ReadonlyArray<StreamTimingReport["type"]> = [
  "start",
  "chunk",
  "end",
  "error",
];

function Legend() {
  return (
    <div className="sm:space-x-4 flex flex-col sm:flex-row justify-center">
      {order.map((type) => {
        return (
          <div key={type} className="space-x-2">
            <div
              className={cn(colors[type], "w-[10px] h-[10px] inline-block")}
            />
            <span className="text-xs dark:text-gray-400">{names[type]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Graph({
  reports,
  summary: { total },
}: {
  reports: ReadonlyArray<StreamTimingReport>;
  summary: Summary;
}) {
  // For each of the timing reports, we want to create a bar graph.
  return (
    <CardDetail title="Chunk Graph">
      <div className={cn("flex items-center", styles.reports)}>
        {total ? (
          reports.map((report, index) => {
            let took: number;
            if (report.type === "start") {
              took = report.timing;
            } else {
              took = report.delta;
            }

            const width = (took / total) * 100;
            return (
              <a
                key={index}
                title={`${report.type} took ${took.toFixed(2)}ms`}
                href={`#${report.type}-${index}`}
                className={colors[report.type]}
                style={{ width: `${width}%` }}
              ></a>
            );
          })
        ) : (
          <div className="w-full bg-slate-400 dark:bg-slate-700 animate-pulse text-center text-xs">
            <p className="leading-5">Loading...</p>
          </div>
        )}
      </div>
      <Legend />
    </CardDetail>
  );
}

export function ReportSummary({ summary, reports }: Props) {
  return (
    <Card title="Stream Profile Summary">
      <Graph summary={summary} reports={reports} />
      <CardDetail title="End of Headers">
        {summary.headers !== null ? (
          summary.headers.toFixed(2) + "ms"
        ) : (
          <Loading />
        )}
      </CardDetail>
      <CardDetail title="Chunk Count">
        {summary.chunks !== null && summary.total !== null ? (
          summary.chunks
        ) : (
          <Loading />
        )}
      </CardDetail>
      <CardDetail title="Total Time">
        {summary.total !== null ? summary.total.toFixed(2) + "ms" : <Loading />}
      </CardDetail>
    </Card>
  );
}
