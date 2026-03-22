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
} from "../hooks/use-assistants";
import type { AssistantRecord } from "../types/api-assistant";
import { AssistantCard } from "./assistant-card";
import { AssistantChatDrawer } from "./assistant-chat-drawer";

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

  const [deleteTarget, setDeleteTarget] = useState<AssistantRecord | null>(
    null
  );
  const [chatAssistant, setChatAssistant] = useState<AssistantRecord | null>(
    null
  );

  const openChatDrawer = useCallback((a: AssistantRecord) => {
    setChatAssistant(a);
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
        description="Create and manage voice assistants. Local data for now — API wiring next."
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
          <p className="text-muted-foreground text-sm">Loading assistants…</p>
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
                  onChat={openChatDrawer}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AssistantChatDrawer
        assistant={chatAssistant}
        open={chatAssistant !== null}
        onOpenChange={(next) => {
          if (!next) setChatAssistant(null);
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
    </div>
  );
}
