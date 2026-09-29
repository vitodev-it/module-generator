"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type Module } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentModules } from "@/components/dashboard/recent-modules";
import { BookOpen, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    thisMonth: 0,
    avgSections: 0,
    successRate: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: allModules } = await supabase
        .from("modules")
        .select("*");

      if (!allModules) return;

      const modules = allModules as Module[];
      const thisMonth = modules.filter(
        (m) => m.created_at >= startOfMonth
      ).length;
      const completed = modules.filter((m) => m.status === "complete").length;
      const total = modules.filter((m) => m.status !== "ongoing").length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const avgSections = modules.length > 0 
        ? Math.round(
            modules.reduce((acc, m) => {
              const sections = m.outline_json?.sections;
              return acc + (Array.isArray(sections) ? sections.length : 0);
            }, 0) / modules.length
          )
        : 0;

      setStats({ thisMonth, avgSections, successRate });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-text">Dashboard</h1>
          <p className="mt-1 text-sm text-warm-muted">
            Overview of your training module generation
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-ember px-4 text-sm font-medium text-warm-text hover:bg-ember-hover transition-colors"
        >
          + New Module
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Modules This Month"
          value={stats.thisMonth}
          accent="ember"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg Sections per Module"
          value={stats.avgSections}
          accent="sage"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          accent="gold"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <RecentModules />
    </div>
  );
}
