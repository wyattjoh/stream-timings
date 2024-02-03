import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stream Timings Profiler",
  description: "Generates stream timing profiles for a given URL.",
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
