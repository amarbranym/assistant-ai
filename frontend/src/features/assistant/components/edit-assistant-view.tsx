"use client";

import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useAssistantQuery } from "../hooks/use-assistants";
import { ASSISTANTS_ROUTE } from "../lib/constants";
import { mapAssistantRecordToFormValues } from "../lib/map-assistant-to-create-form";
import { CreateAssistantForm } from "./create-assistant/create-assistant-form";

type EditAssistantViewProps = {
  assistantId: string;
};

export function EditAssistantView({ assistantId }: EditAssistantViewProps) {
  const {
    data: assistant,
    isPending,
    isError,
    error,
    refetch,
  } = useAssistantQuery(assistantId);

  const backLink = (
    <Link
      href={ASSISTANTS_ROUTE}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      Back to assistants
    </Link>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardPageHeader
        title={assistant ? `Edit · ${assistant.name}` : "Edit assistant"}
        description="Update model, voice, tools, and advanced options. Changes apply when you save."
        actions={backLink}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
          {isPending ? (
            <p className="text-muted-foreground text-sm">Loading assistant…</p>
          ) : isError ? (
            <Card className="border-destructive/40 bg-destructive/5 rounded-lg">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Couldn&apos;t load assistant
                </CardTitle>
                <CardDescription>
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
                <Link
                  href={ASSISTANTS_ROUTE}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  Back to list
                </Link>
              </CardContent>
            </Card>
          ) : assistant ? (
            <CreateAssistantForm
              key={`${assistant.id}-${assistant.updatedAt}`}
              variant="edit"
              assistantId={assistant.id}
              initialValues={mapAssistantRecordToFormValues(assistant)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
