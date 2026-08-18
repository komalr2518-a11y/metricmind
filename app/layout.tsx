import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetricMind — Semantic BI Prototype",
  description:
    "Explore governed-style business metrics, trends, and breakdowns with a transparent demo semantic layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
