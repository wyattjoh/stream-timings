import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/handler.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  format: "esm",
  dts: true,
});
