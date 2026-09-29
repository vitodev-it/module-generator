"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Module } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, ChevronRight } from "lucide-react";

interface LogEntry {
  type: "info" | "done" | "error" | "active";
  message: string;
}

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!data) return;
      const m = data as Module;
      setModule(m);

      const prog = m.progress as any;
      if (prog?.message) {
        const existing = logs.find((l) => l.message === prog.message);
        if (!existing) {
          setLogs((prev) => {
            // Mark previous active as done
            const updated = prev.map((l) =>
              l.type === "active" ? { ...l, type: "done" as const } : l
            );
            const entryType = prog.step === "error" ? "error"
              : prog.step === "complete" ? "done"
              : "active";
            return [...updated, { type: entryType, message: prog.message }];
          });
        }
        setPct(prog.pct || 0);
      }

      if (m.status === "complete" || m.status === "failed") {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [params.id, logs]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0A0A0B]">
          {module ? module.topic : "Generating Module"}
        </h1>
        <p className="mt-1 text-sm text-[#666666]">
          {module?.status === "complete"
            ? "Generation complete"
            : module?.status === "failed"
            ? "Generation failed"
            : "Generating your training module..."}
        </p>
      </div>

      {/* Progress bar */}
      {module?.status === "ongoing" && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEAEA]">
          <div
            className="h-full rounded-full bg-[#0A0A0B] transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Status badges */}
      {module?.status === "complete" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
          <span className="text-sm font-medium text-[#22C55E]">
            Module generated successfully!
          </span>
        </div>
      )}
      {module?.status === "failed" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3">
          <XCircle className="h-5 w-5 text-[#EF4444]" />
          <div>
            <span className="text-sm font-medium text-[#EF4444]">
              Generation failed
            </span>
            {module?.error && (
              <p className="mt-0.5 text-xs text-[#666666]">{module.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Live log */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#666666]">
            Process Log
          </p>
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                {log.type === "active" ? (
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[#0A0A0B]" />
                ) : log.type === "done" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#22C55E]" />
                ) : log.type === "error" ? (
                  <XCircle className="mt-0.5 h-4 w-4 text-[#EF4444]" />
                ) : (
                  <div className="mt-0.5 h-4 w-4 rounded-full border border-[#666666]" />
                )}
                <span
                  className={
                    log.type === "active"
                      ? "text-[#0A0A0B] font-medium"
                      : log.type === "done"
                      ? "text-[#22C55E]"
                      : log.type === "error"
                      ? "text-[#EF4444]"
                      : "text-[#666666]"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-[#666666] italic">
                Waiting for generation to start...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {module?.status === "complete" && (
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push(`/modules/${params.id}/review`)}>
            Review Module
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
      {module?.status === "failed" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/create")}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
