"use client";

import {
  BarChart3,
  Bot,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/auth-context";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";
import { cn } from "@/lib/utils";
import { ASSISTANT_NEW_ROUTE } from "@/features/assistant/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SIGN_IN_ROUTE } from "@/features/auth/lib/routes";

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
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, isLoading } = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const name = data?.user.name?.trim() || "User";
  const email = data?.user.email?.trim() || "";
  const avatarUrl = data?.user.avatarUrl ?? null;
  const initials = useMemo(() => {
    const source = (data?.user.name || data?.user.email || "U").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [data?.user.email, data?.user.name]);

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push(SIGN_IN_ROUTE);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

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

      <div className="border-sidebar-border border-t p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="bg-sidebar-accent/35 border-sidebar-border hover:bg-sidebar-accent/55 focus-visible:border-ring/60 focus-visible:ring-ring/35 data-popup-open:bg-sidebar-accent/55 flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Open profile menu"
          >
            <div className="bg-sidebar-primary/15 text-sidebar-primary relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
              {!imageFailed && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${name} avatar`}
                  className="size-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span>{isLoading ? "…" : initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">
                {isLoading ? "Loading profile..." : name}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {isLoading ? "Loading email..." : (email || "No email")}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-48">
            <DropdownMenuItem
              onClick={() => void onSignOut()}
              disabled={signingOut}
              className="cursor-pointer"
            >
              <LogOut className="size-4" aria-hidden />
              {signingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
