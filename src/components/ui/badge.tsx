import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0B] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0A0A0B]/20 text-[#0A0A0B]",
        secondary: "border-transparent bg-[#999999]/20 text-[#999999]",
        destructive: "border-transparent bg-[#EF4444]/20 text-[#EF4444]",
        success: "border-transparent bg-[#22C55E]/20 text-[#22C55E]",
        warning: "border-transparent bg-[#F59E0B]/20 text-[#F59E0B]",
        gold: "border-transparent bg-[#0070F3]/20 text-[#0070F3]",
        outline: "text-[#0A0A0B] border-[#EAEAEA]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
