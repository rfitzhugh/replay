import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Replay",
  description:
    "An interactive walkthrough that reveals how an experienced engineer reads a unit test.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: ignore extension-injected body attributes (e.g. Grammarly) */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
