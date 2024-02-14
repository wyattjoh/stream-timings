import { StreamTimingReport } from "@wyattjoh/stream-utils";
import { useMemo } from "react";

export type Summary = {
  headers: number | null;
  chunks: number | null;
  total: number | null;
};

export function useSummary(reports: ReadonlyArray<StreamTimingReport>) {
  return useMemo(() => {
    const initial: Summary = {
      headers: null,
      chunks: null,
      total: null,
    };

    if (reports.length === 0) {
      return initial;
    }

    return reports.reduce((acc, report) => {
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
    }, initial);
  }, [reports]);
}
