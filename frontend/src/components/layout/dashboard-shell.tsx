import { AppSidebar } from "@/components/layout/app-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden md:flex-row">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
