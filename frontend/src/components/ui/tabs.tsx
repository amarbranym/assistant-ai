"use client";

import * as React from "react";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-0", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "border-border text-muted-foreground inline-flex w-full max-w-full flex-nowrap items-stretch justify-start gap-1.5 overflow-x-auto overflow-y-hidden scroll-smooth border-b border-transparent bg-transparent [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "ring-ring/25 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none",
        "text-muted-foreground hover:text-foreground data-active:text-primary relative -mb-px inline-flex min-h-8 shrink-0 touch-manipulation items-center justify-center gap-1.5 border-b-2 border-transparent px-2.5 py-2.5 text-xs font-medium transition-[color,background-color,border-color] duration-200 ease-out sm:min-h-9 sm:px-3.5 sm:text-sm",
        "data-active:border-b-primary data-active:bg-muted/35 data-active:font-semibold",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  keepMounted = true,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel> & {
  keepMounted?: boolean;
}) {
  return (
    <TabsPrimitive.Panel
      keepMounted={keepMounted}
      className={cn(
        "ring-ring/25 mt-7 flex flex-1 flex-col transition-opacity duration-200 ease-out focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
