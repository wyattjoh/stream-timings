import { StreamTimingReport } from "@/types";

export function encode(report: StreamTimingReport): string {
  return (
    JSON.stringify(report) +
    // Add a newline to separate each report (newline delimited JSON).
    "\n"
  );
}

export function decode(chunk: string): StreamTimingReport[] {
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
