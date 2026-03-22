"use client";

import * as React from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function SelectRoot({
  ...props
}: React.ComponentProps<typeof Select.Root>) {
  return <Select.Root data-slot="select" {...props} />;
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Select.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <Select.Trigger
      ref={ref}
      data-slot="select-trigger"
      className={cn(
        "focus-control border-input bg-background text-foreground flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-left text-sm transition-colors",
        "data-popup-open:bg-muted/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_color-mix(in_srgb,var(--destructive)_35%,transparent)]",
        "dark:bg-input/30 dark:aria-invalid:border-destructive/60",
        className
      )}
      {...props}
    >
      {children}
      <Select.Icon
        className="text-muted-foreground shrink-0 [&_svg]:size-4 [&_svg]:opacity-70"
        data-slot="select-icon"
      >
        <ChevronDown className="size-4" />
      </Select.Icon>
    </Select.Trigger>
  );
});

function SelectValue({
  className,
  ...props
}: React.ComponentProps<typeof Select.Value>) {
  return (
    <Select.Value
      data-slot="select-value"
      className={cn(
        "line-clamp-1 flex-1 data-placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

type SelectContentProps = React.ComponentProps<typeof Select.Popup> &
  Pick<
    React.ComponentProps<typeof Select.Positioner>,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...popupProps
}: SelectContentProps) {
  return (
    <Select.Portal>
      <Select.Positioner
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
      >
        <Select.Popup
          data-slot="select-content"
          className={cn(
            "border-border bg-popover text-popover-foreground z-50 max-h-[min(320px,var(--available-height))] min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-lg border p-1 shadow-md ring-1 ring-foreground/10",
            "data-starting-style:animate-in data-starting-style:fade-in-0 data-starting-style:zoom-in-95",
            "data-ending-style:animate-out data-ending-style:fade-out-0 data-ending-style:zoom-out-95",
            className
          )}
          {...popupProps}
        >
          <Select.List
            data-slot="select-list"
            className="max-h-[min(280px,var(--available-height))] overflow-y-auto p-1"
          >
            {children}
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  );
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Select.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <Select.Item
      ref={ref}
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <Select.ItemIndicator>
          <Check className="size-3.5" />
        </Select.ItemIndicator>
      </span>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
});

function SelectGroup({
  ...props
}: React.ComponentProps<typeof Select.Group>) {
  return <Select.Group data-slot="select-group" {...props} />;
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof Select.GroupLabel>) {
  return (
    <Select.GroupLabel
      data-slot="select-label"
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Select.Separator>) {
  return (
    <Select.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

export {
  SelectRoot as Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
