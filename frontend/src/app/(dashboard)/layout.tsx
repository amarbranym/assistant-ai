import { DashboardAuthBoundary } from "@/components/layout/dashboard-auth-boundary";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthBoundary>
      <DashboardShell>{children}</DashboardShell>
    </DashboardAuthBoundary>
  );
}
