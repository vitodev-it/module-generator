export const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

export const DEFAULT_MODELS = {
  outlineModel: "gpt-4o-mini",
  contentModel: "gpt-4o-mini",
};

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Workspace", href: "/workspace", icon: "SplitSquareHorizontal" },
  { label: "Create Module", href: "/create", icon: "PlusCircle" },
  { label: "Modules", href: "/modules", icon: "FolderOpen" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;
