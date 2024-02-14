import type { StreamTimingReport } from "@wyattjoh/stream-utils";
import { ReportDetail } from "./report-detail";
import { Card } from "./card";
import { CardDetail } from "./card-detail";
import { cn } from "@/lib/cn";

const ReportName: Record<StreamTimingReport["type"], string> = {
  start: "Headers",
  chunk: "Data Chunk",
  end: "Request End",
  error: "Error",
};

type Props = {
  id: string;
  report: StreamTimingReport;
};

const colors: Record<StreamTimingReport["type"], string> = {
  start:
    "border-indigo-400 bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900",
  chunk:
    "border-emerald-400 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900",
  end: "border-yellow-400 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900",
  error: "border-red-400 bg-red-100 dark:border-red-800 dark:bg-red-900",
};

export function Report({ id, report }: Props) {
  return (
    <Card
      id={id}
      title={ReportName[report.type]}
      className={cn("border-4", colors[report.type])}
    >
      <CardDetail title="Since Start">{report.timing.toFixed(2)}ms</CardDetail>
      <CardDetail title="Since Previous">
        {report.delta.toFixed(2)}ms
      </CardDetail>
      {report.type !== "end" && (
        <CardDetail title="Data">
          <ReportDetail report={report} />
        </CardDetail>
      )}
    </Card>
  );
}
