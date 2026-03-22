"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  React.ComponentProps<"button">,
  "type" | "role" | "onClick"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

function Switch({
  className,
  checked,
  onCheckedChange,
  disabled,
  id,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "border-border bg-muted/80 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 md:h-6 md:w-11",
        checked && "bg-primary border-primary",
        checked ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      <span className="bg-background pointer-events-none block size-4 rounded-full shadow-theme ring-1 ring-foreground/10 md:size-5" />
    </button>
  );
}

export { Switch };
