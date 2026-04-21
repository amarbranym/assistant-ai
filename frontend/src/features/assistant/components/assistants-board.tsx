"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ASSISTANT_NEW_ROUTE, assistantEditRoute } from "../lib/constants";
import {
  useAssistantsQuery,
  useDeleteAssistantMutation,
  useAssistantPublishReadinessQuery,
  usePublishAssistantMutation,
  useUnpublishAssistantMutation,
} from "../hooks/use-assistants";
import type { AssistantRecord } from "../types/api-assistant";
import { AssistantCard } from "./assistant-card";
import {
  AssistantChatDrawer,
  type AssistantDrawerMode,
} from "./assistant-chat-drawer";

function AssistantsLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="bg-muted/45 h-4 w-52 animate-pulse rounded-md" />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={`assistant-skeleton-${i}`}>
            <div className="border-border bg-card h-full overflow-hidden rounded-lg border shadow-theme">
              <div className="space-y-3 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="bg-muted/50 h-4 w-3/5 animate-pulse rounded-sm" />
                    <div className="bg-muted/40 h-3 w-5/6 animate-pulse rounded-sm" />
                  </div>
                  <div className="bg-muted/50 size-7 animate-pulse rounded-md" />
                </div>
                <div className="bg-muted/45 h-5 w-16 animate-pulse rounded-full" />
                <div className="space-y-2.5 pt-1">
                  <div className="bg-muted/40 h-8 animate-pulse rounded-md" />
                  <div className="bg-muted/40 h-8 animate-pulse rounded-md" />
                </div>
              </div>
              <div className="bg-muted/20 border-border/70 border-t px-3 py-2.5">
                <div className="bg-muted/40 mb-2 h-3.5 w-2/5 animate-pulse rounded-sm" />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-muted/50 h-7 animate-pulse rounded-md" />
                  <div className="bg-muted/50 h-7 animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          </li>
        ))}
        
      </ul>
    </div>
  );
}

export function AssistantsBoard() {
  const router = useRouter();
  const {
    data: assistants = [],
    isError,
    isPending,
    refetch,
    error,
  } = useAssistantsQuery();
  const deleteMutation = useDeleteAssistantMutation();
  const publishMutation = usePublishAssistantMutation();
  const unpublishMutation = useUnpublishAssistantMutation();

  const [deleteTarget, setDeleteTarget] = useState<AssistantRecord | null>(
    null
  );
  const [drawerAssistant, setDrawerAssistant] = useState<AssistantRecord | null>(
    null
  );
  const [publishTarget, setPublishTarget] = useState<AssistantRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<AssistantDrawerMode>("chat");
  const publishReadiness = useAssistantPublishReadinessQuery(
    publishTarget?.id ?? "",
    Boolean(publishTarget)
  );

  const openChatDrawer = useCallback((a: AssistantRecord) => {
    setDrawerMode("chat");
    setDrawerAssistant(a);
  }, []);

  const openVoiceDrawer = useCallback((a: AssistantRecord) => {
    setDrawerMode("voice");
    setDrawerAssistant(a);
  }, []);

  const goToEdit = useCallback(
    (a: AssistantRecord) => {
      router.push(assistantEditRoute(a.id));
    },
    [router]
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      /* mutation surfaces error; keep dialog open */
    }
  }

  async function confirmPublishToggle() {
    if (!publishTarget) return;
    const config =
      publishTarget.config && typeof publishTarget.config === "object"
        ? (publishTarget.config as Record<string, unknown>)
        : {};
    const deployment =
      config.deployment && typeof config.deployment === "object"
        ? (config.deployment as Record<string, unknown>)
        : {};
    const isPublished = deployment.status === "published";
    if (isPublished) {
      await unpublishMutation.mutateAsync(publishTarget.id);
      setPublishTarget(null);
      return;
    }
    await publishMutation.mutateAsync(publishTarget.id);
    setPublishTarget(null);
  }

  const listError =
    isError && error instanceof Error ? error.message : "Failed to load assistants.";

  const newAssistantLink = (
    <Link
      href={ASSISTANT_NEW_ROUTE}
      className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
    >
      <Plus className="size-4" aria-hidden />
      New assistant
    </Link>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <DashboardPageHeader
        title="Assistants"
        description="Create, test, and manage assistants across chat and live voice."
        actions={newAssistantLink}
      />

      <div className="w-full flex-1 px-5 py-6 sm:px-6">
        {isError ? (
          <Card className="border-destructive/40 bg-destructive/5 rounded-lg">
            <CardHeader>
              <CardTitle className="text-destructive">Couldn&apos;t load</CardTitle>
              <CardDescription>{listError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : isPending ? (
          <AssistantsLoadingSkeleton />
        ) : assistants.length === 0 ? (
          <Card className="rounded-lg border-dashed border-border bg-muted/20">
            <CardHeader>
              <CardTitle>No assistants yet</CardTitle>
              <CardDescription>
                Create your first assistant to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>{newAssistantLink}</CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {assistants.map((a) => (
              <li key={a.id}>
                <AssistantCard
                  assistant={a}
                  formattedUpdated={formatDateTime(a.updatedAt)}
                  onEdit={goToEdit}
                  onDelete={setDeleteTarget}
                  onTogglePublish={setPublishTarget}
                  onChat={openChatDrawer}
                  onTalk={openVoiceDrawer}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AssistantChatDrawer
        assistant={drawerAssistant}
        mode={drawerMode}
        open={drawerAssistant !== null}
        onOpenChange={(next) => {
          if (!next) setDrawerAssistant(null);
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Delete assistant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="text-foreground font-medium">
                {deleteTarget?.name}
              </span>{" "}
              from this list. You can add API persistence later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Could not delete."}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!publishTarget}
        onOpenChange={(open) => !open && setPublishTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Publish status</AlertDialogTitle>
            <AlertDialogDescription>
              Review deployment readiness before publishing this assistant.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {publishReadiness.isPending ? (
            <p className="text-sm text-muted-foreground">Checking readiness…</p>
          ) : publishReadiness.isError ? (
            <p className="text-sm text-destructive">
              {publishReadiness.error instanceof Error
                ? publishReadiness.error.message
                : "Could not load readiness checks."}
            </p>
          ) : publishReadiness.data ? (
            <div className="space-y-2">
              {publishReadiness.data.checks.map((check) => (
                <div key={check.key} className="rounded-md border px-3 py-2">
                  <p className="text-sm font-medium">
                    {check.label} {check.passed ? "✓" : "✕"}
                  </p>
                  {!check.passed ? (
                    <p className="text-xs text-destructive">{check.message}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {(publishMutation.isError || unpublishMutation.isError) ? (
            <p className="text-destructive text-sm" role="alert">
              {publishMutation.error instanceof Error
                ? publishMutation.error.message
                : unpublishMutation.error instanceof Error
                  ? unpublishMutation.error.message
                  : "Could not update publish status."}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={publishMutation.isPending || unpublishMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                publishMutation.isPending ||
                unpublishMutation.isPending ||
                (publishReadiness.data?.status !== "published" && !publishReadiness.data?.canPublish)
              }
              onClick={(e) => {
                e.preventDefault();
                void confirmPublishToggle();
              }}
            >
              {publishMutation.isPending || unpublishMutation.isPending
                ? "Updating…"
                : publishReadiness.data?.status === "published"
                  ? "Unpublish"
                  : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
