import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/60 bg-card/60  border-b",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-2 px-5 py-3 sm:px-6",
          "justify-between"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* <div className="border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border">
            <LayoutDashboard className="size-4" aria-hidden />
          </div> */}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-muted-foreground mb-0.5 font-mono text-[0.6rem] uppercase tracking-widest">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-heading text-foreground text-md font-medium leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-[0.65rem] leading-snug">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
