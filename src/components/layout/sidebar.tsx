"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Settings,
  GraduationCap,
  SplitSquareHorizontal,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  SplitSquareHorizontal: <SplitSquareHorizontal className="h-5 w-5" />,
  PlusCircle: <PlusCircle className="h-5 w-5" />,
  FolderOpen: <FolderOpen className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-[#EAEAEA] bg-[#F6F6F6]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0B]/20">
            <GraduationCap className="h-5 w-5 text-[#0A0A0B]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#0A0A0B]">
              Module Forge
            </span>
            <span className="text-xs text-[#666666]">Training Generator</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[#0A0A0B]/10 text-[#0A0A0B] border-l-2 border-[#0A0A0B]"
                        : "text-[#666666] hover:text-[#0A0A0B] hover:bg-[#FFFFFF] border-l-2 border-transparent"
                    )}
                  >
                    {iconMap[item.icon]}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom info */}
        <div className="border-t border-[#EAEAEA] px-6 py-4">
          <p className="text-xs text-[#666666]">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
