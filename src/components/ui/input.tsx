import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] px-3 py-2 text-sm text-[#0A0A0B] placeholder:text-[#666666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
