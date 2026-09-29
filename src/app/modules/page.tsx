"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type Module } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Search, FileText, ChevronRight } from "lucide-react";

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("topic", `%${search}%`);
      }

      const { data } = await query;
      if (data) setModules(data as Module[]);
      setLoading(false);
    }
    fetch();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0B]">Modules</h1>
          <p className="mt-1 text-sm text-[#666666]">
            All generated training modules
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0B] px-4 text-sm font-medium text-[#0A0A0B] hover:bg-[#333333]"
        >
          + New Module
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
        <Input
          placeholder="Search by topic..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-[#EAEAEA]"
                />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={search ? "No results found" : "No modules yet"}
                description={
                  search
                    ? `No modules matching "${search}"`
                    : "Create your first training module to get started."
                }
                action={
                  !search ? (
                    <Link
                      href="/create"
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0B] px-4 text-sm font-medium text-[#0A0A0B] hover:bg-[#333333]"
                    >
                      Create Module
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[#EAEAEA]">
              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_120px_80px] gap-4 px-6 py-3 text-xs font-medium text-[#666666] uppercase tracking-wider">
                <div>Topic</div>
                <div>Level</div>
                <div>Created</div>
                <div>Status</div>
              </div>

              {/* Rows */}
              {modules.map((m) => (
                <Link
                  key={m.id}
                  href={`/modules/${m.id}/review`}
                  className="grid grid-cols-[1fr_100px_120px_80px] gap-4 px-6 py-3.5 text-sm transition-colors hover:bg-[#F6F6F6] group items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-[#666666]" />
                    <span className="truncate text-[#0A0A0B]">{m.topic}</span>
                  </div>
                  <div className="text-[#666666]">{m.level}</div>
                  <div className="text-[#666666] text-xs">
                    {formatDate(m.created_at)}
                  </div>
                  <StatusBadge status={m.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
