import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  ongoing: { variant: "warning" as const, label: "Ongoing" },
  complete: { variant: "success" as const, label: "Complete" },
  failed: { variant: "destructive" as const, label: "Failed" },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    variant: "outline" as const,
    label: status,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
