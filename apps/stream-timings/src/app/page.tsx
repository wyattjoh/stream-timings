"use client";

import type { StreamTimingReport } from "@wyattjoh/stream-utils";
import { useState } from "react";
import { StreamForm } from "@/components/stream-form";
import { Reports } from "@/components/reports";

export default function Page() {
  const [reports, setReports] = useState<StreamTimingReport[]>([]);

  return (
    <div className="font-mono flex flex-col h-full">
      <div className="max-w-[800px] mx-auto px-4 space-y-4 py-6">
        <div>
          <h1 className="text-3xl font-semibold">Stream Timings Profiler</h1>
          <div>
            <a
              href="https://github.com/wyattjoh/stream-timings"
              className="underline text-sm text-slate-400"
            >
              https://github.com/wyattjoh/stream-timings
            </a>
          </div>
        </div>
        <p>
          This tool generates stream timing profiles for a given URL. It does
          this by making a request to the URL and then parsing the stream
          timings from the server.
        </p>
        <StreamForm setReports={setReports} />
      </div>
      <div className="flex-grow bg-slate-200 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-600">
        <div className="max-w-[800px] mx-auto space-y-4 my-6">
          <Reports reports={reports} />
        </div>
      </div>
    </div>
  );
}
