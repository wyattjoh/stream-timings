import { z } from "zod";

export const schema = z.object({
  url: z.string().min(1).url(),
  compress: z.string().min(1),
});

export type Schema = z.infer<typeof schema>;
