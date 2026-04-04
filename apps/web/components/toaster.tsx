"use client";

import { ToastProvider } from "@emailed/ui";

export function Toaster({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
