"use client";

import type React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <Sidebar />
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
