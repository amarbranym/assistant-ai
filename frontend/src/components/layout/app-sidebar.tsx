"use client";

import {
  BarChart3,
  Bot,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ASSISTANT_NEW_ROUTE } from "@/features/assistant/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Bot;
  match: (path: string) => boolean;
};

const workspaceNav: NavItem[] = [
  {
    href: "/assistants",
    label: "Assistants",
    icon: Bot,
    match: (path) =>
      path === "/assistants" ||
      (path.startsWith("/assistants/") &&
        !path.startsWith("/assistants/new")),
  },
  {
    href: ASSISTANT_NEW_ROUTE,
    label: "New assistant",
    icon: PlusCircle,
    match: (path) => path === "/assistants/new",
  },
];

const platformNav: NavItem[] = [
  {
    href: "/tools",
    label: "Tools",
    icon: Wrench,
    match: (path) => path === "/tools" || path.startsWith("/tools/"),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    match: (path) =>
      path === "/analytics" || path.startsWith("/analytics/"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (path) =>
      path === "/settings" || path.startsWith("/settings/"),
  },
];

function NavSection({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground px-2.5 pb-1 text-[0.6rem] font-semibold uppercase tracking-wider">
        {title}
      </p>
      <ul className="flex flex-row gap-0.5 overflow-x-auto pb-0.5 md:flex-col md:overflow-visible md:pb-0">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0 md:shrink">
              <Link
                href={item.href}
                className={cn(
                  "group flex min-h-[2.35rem] items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-[background-color,border-color,color,box-shadow] duration-150",
                  active
                    ? "border-sidebar-primary/25 bg-sidebar-primary/12 text-sidebar-primary shadow-theme"
                    : "border-transparent text-sidebar-foreground/90 hover:border-sidebar-border/80 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-opacity",
                    active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                  )}
                  aria-hidden
                />
                <span className="truncate font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex w-full shrink-0 flex-col border-sidebar-border md:h-full md:w-[min(100%,15.5rem)] md:border-r md:border-b-0 border-b"
      )}
    >
      <div className="flex items-center gap-2.5 border-sidebar-border px-3 py-3 md:border-b">
        <div className="border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <LayoutDashboard className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm font-medium leading-tight">
            Console
          </p>
          <p className="text-muted-foreground mt-0.5 text-[0.65rem] leading-snug">
            Voice agents
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-2.5 md:flex-1 md:min-h-0 md:overflow-y-auto md:py-1">
        <NavSection title="Workspace" items={workspaceNav} />

        <div
          className="border-sidebar-border hidden border-t border-dashed opacity-50 md:block"
          aria-hidden
        />

        <NavSection title="Platform" items={platformNav} />
      </div>
    </aside>
  );
}
