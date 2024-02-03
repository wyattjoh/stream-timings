type StartStreamReport = {
  type: "start";
  data: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
};

type ChunkStreamReport = {
  type: "chunk";
  data: {
    chunk: string;
  };
};

type EndStreamReport = {
  type: "end";
};

export type ErrorStreamReport = {
  type: "error";
  data: {
    message: string;
  };
};

export type StreamReport =
  | StartStreamReport
  | ChunkStreamReport
  | EndStreamReport
  | ErrorStreamReport;

export type StreamTimingReport = StreamReport & {
  timing: number;
  delta: number;
};
