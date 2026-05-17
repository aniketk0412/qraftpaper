import type { ComponentPropsWithoutRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends ComponentPropsWithoutRef<"input"> {
  label: string;
  id: string;
  icon?: LucideIcon;
}

export function AuthField({
  label,
  id,
  icon: Icon,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.78rem] font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        )}
        <input
          id={id}
          className={cn(
            "h-11 w-full rounded-xl border border-line bg-white/[0.03] px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-violet/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet/20",
            Icon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}
