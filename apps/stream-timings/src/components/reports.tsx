import type { StreamTimingReport } from "@wyattjoh/stream-utils";
import { Report } from "./report";
import { ReportSummary } from "./report-summary";
import { Summary, useSummary } from "./use-summary";

type Props = {
  reports: StreamTimingReport[];
};

export function Reports({ reports }: Props) {
  const summary = useSummary(reports);
  if (reports.length === 0) {
    return null;
  }

  return (
    <>
      <ReportSummary summary={summary} reports={reports} />
      {reports.map((report, index) => {
        return (
          <Report key={index} id={`${report.type}-${index}`} report={report} />
        );
      })}
    </>
  );
}
