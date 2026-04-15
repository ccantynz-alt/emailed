import type { Metadata } from "next";
import { Italianno, Inter } from "next/font/google";
import { ThemeProvider, Box } from "@emailed/ui";
import "./globals.css";

const italianno = Italianno({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-italianno",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlecRae Admin — Operational Dashboard",
  description:
    "Monitor and manage the AlecRae platform. AI-powered insights, reputation management, and real-time operational intelligence.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box
      as="html"
      lang="en"
      className={`h-full antialiased dark ${italianno.variable} ${inter.variable}`}
    >
      <Box as="body" className="h-full bg-surface text-content font-sans">
        <ThemeProvider mode="dark">
          {children}
        </ThemeProvider>
      </Box>
    </Box>
  );
}
