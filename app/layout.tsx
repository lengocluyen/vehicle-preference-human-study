import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Preference Study — Demonstration",
  description: "Ethics-gated interface for a vehicle preference research study.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
