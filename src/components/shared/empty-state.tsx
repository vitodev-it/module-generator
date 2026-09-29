import { cn } from "@/lib/utils";
import { FileX2 } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-[#EAEAEA] bg-[#FFFFFF] px-8 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 text-[#666666]">
        {icon || <FileX2 className="h-12 w-12" />}
      </div>
      <h3 className="mb-1 text-lg font-medium text-[#0A0A0B]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[#666666]">{description}</p>
      {action}
    </div>
  );
}
