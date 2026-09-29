"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type Module } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

export function RecentModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setModules(data as Module[]);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#0A0A0B]">Recent Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-[#EAEAEA]"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <EmptyState
        title="No modules yet"
        description="Create your first training module to get started."
        action={
          <Link
            href="/create"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0B] px-4 text-sm font-medium text-[#0A0A0B] hover:bg-[#333333]"
          >
            Create Module
          </Link>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-[#0A0A0B]">Recent Modules</CardTitle>
        <Link
          href="/modules"
          className="text-xs text-[#0A0A0B] hover:text-[#333333]"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/modules/${m.id}/review`}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[#F6F6F6] group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-[#666666]" />
                <span className="text-sm text-[#0A0A0B] truncate">
                  {m.topic}
                </span>
                <StatusBadge status={m.status} />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#666666]">
                  {formatDate(m.created_at)}
                </span>
                <ChevronRight className="h-4 w-4 text-[#666666] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
