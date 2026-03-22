import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

type PlaceholderPageProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  title,
  description = "This section is a placeholder — wire it up when you’re ready.",
  children,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <DashboardPageHeader title={title} description={description} />
      <div className="text-muted-foreground flex flex-1 items-start px-5 py-6 text-sm sm:px-6">
        {children ?? (
          <p className="max-w-md leading-relaxed">
            Content for <span className="text-foreground font-medium">{title}</span>{" "}
            will go here.
          </p>
        )}
      </div>
    </div>
  );
}
