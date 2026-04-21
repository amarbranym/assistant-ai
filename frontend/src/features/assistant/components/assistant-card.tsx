"use client";

import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Globe,
  MessageSquare,
  Mic,
  Mic2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { memo } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  assistantModelDisplay,
  assistantVoiceDisplay,
} from "../lib/config-summary";
import type { AssistantRecord } from "../types/api-assistant";

type AssistantCardProps = {
  assistant: AssistantRecord;
  formattedUpdated: string;
  onEdit: (assistant: AssistantRecord) => void;
  onDelete: (assistant: AssistantRecord) => void;
  onTogglePublish?: (assistant: AssistantRecord) => void;
  onChat?: (assistant: AssistantRecord) => void;
  onTalk?: (assistant: AssistantRecord) => void;
};

const MetaRow = memo(function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
      <div className="text-primary/90 flex size-6 shrink-0 items-center justify-center rounded-md bg-background">
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-foreground text-xs leading-tight wrap-break-word">
          {value}
        </p>
      </div>
    </div>
  );
});

function AssistantCardInner({
  assistant: a,
  formattedUpdated,
  onEdit,
  onDelete,
  onTogglePublish,
  onChat,
  onTalk,
}: AssistantCardProps) {
  const router = useRouter();
  const modelLine = assistantModelDisplay(a.config);
  const voiceLine = assistantVoiceDisplay(a.config);
  const inactive = !a.active;
  const config = a.config && typeof a.config === "object" ? (a.config as Record<string, unknown>) : {};
  const deployment =
    config.deployment && typeof config.deployment === "object"
      ? (config.deployment as Record<string, unknown>)
      : {};
  const channels =
    config.channels && typeof config.channels === "object"
      ? (config.channels as Record<string, unknown>)
      : {};
  const phoneEnabled =
    channels.phone &&
    typeof channels.phone === "object" &&
    (channels.phone as Record<string, unknown>).enabled === true;
  const whatsappEnabled =
    channels.whatsapp &&
    typeof channels.whatsapp === "object" &&
    (channels.whatsapp as Record<string, unknown>).enabled === true;
  const channelLine = [phoneEnabled ? "Phone" : null, whatsappEnabled ? "WhatsApp" : null]
    .filter(Boolean)
    .join(" + ") || "No channels";
  const isPublished = deployment.status === "published";

  function handleChat() {
    if (onChat) {
      onChat(a);
      return;
    }
    router.push(`/assistants/${a.id}/chat`);
  }

  function handleTalk() {
    if (onTalk) {
      onTalk(a);
      return;
    }
    router.push(`/assistants/${a.id}/talk`);
  }

  function handleLogs() {
    router.push(`/assistants/${a.id}/logs`);
  }

  return (
    <article
      className={cn(
        "focus-within:ring-ring/50 h-full rounded-lg focus-within:ring-1 focus-within:ring-offset-1 focus-within:ring-offset-background",
        inactive && "opacity-[0.92]"
      )}
    >
      <Card
        size="sm"
        className={cn(
          "group/card border-border h-full gap-0 overflow-hidden rounded-xl border bg-card py-0 text-card-foreground ring-0",
          "shadow-theme transition-[border-color,box-shadow] duration-150",
          "hover:border-primary/30 hover:shadow-theme",
          inactive && "hover:border-border/80"
        )}
      >
        <CardHeader className="gap-0 px-4 pt-3 pb-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <CardTitle className="text-foreground truncate text-base font-semibold leading-tight">
                {a.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-xs leading-snug">
                {a.description?.trim() || "No description"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-muted-foreground hover:bg-muted/70 hover:text-foreground -mr-1 shrink-0"
                )}
                aria-label={`More actions for ${a.name}`}
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(a)}>
                  <Pencil className="mr-2 size-3.5" aria-hidden />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => onDelete(a)}
                >
                  <Trash2 className="mr-2 size-3.5" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {a.active ? (
                <Badge
                  variant="secondary"
                  className="h-6 gap-1 px-2 py-0 text-[11px] font-medium"
                >
                  <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground h-6 gap-1 px-2 py-0 text-[11px]"
                >
                  <span
                    className="bg-muted-foreground size-1.5 shrink-0 rounded-full opacity-70"
                    aria-hidden
                  />
                  Inactive
                </Badge>
              )}
              <Badge
                variant={isPublished ? "secondary" : "outline"}
                className="h-6 px-2 py-0 text-[11px]"
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <Badge variant="outline" className="h-6 gap-1 px-2 py-0 text-[11px]">
              <Globe className="size-3" />
              {channelLine}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 px-4 pb-2 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-[11px] font-semibold uppercase tracking-wide">
              Assistant Setup
            </span>
            <Separator className="bg-border/40 flex-1" />
          </div>
          <div className="grid gap-2">
            <MetaRow icon={Sparkles} label="Model" value={modelLine} />
            <MetaRow icon={Mic} label="Voice" value={voiceLine} />
          </div>
        </CardContent>

        <CardFooter className="bg-muted/15 flex-col gap-0 border-t-0 p-0">
          <div className="flex w-full flex-col gap-2 px-4 py-3">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] leading-none">
              <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
              <span>
                Updated{" "}
                <time className="text-foreground/90 font-medium">
                  {formattedUpdated}
                </time>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full gap-1.5 text-xs font-medium"
                disabled={inactive}
                onClick={handleChat}
                aria-label={`Open chat with ${a.name}`}
                title={inactive ? "Activate assistant to chat" : undefined}
              >
                <MessageSquare className="size-3 shrink-0" aria-hidden />
                Chat
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 w-full gap-1.5 text-xs font-medium shadow-none"
                disabled={inactive}
                onClick={handleTalk}
                aria-label={`Talk with ${a.name}`}
                title={inactive ? "Activate assistant to talk" : undefined}
              >
                <Mic2 className="size-3 shrink-0" aria-hidden />
                Talk
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-1.5 text-xs font-medium"
              onClick={handleLogs}
            >
              <MessageSquare className="size-3 shrink-0" aria-hidden />
              Logs
            </Button>
            {onTogglePublish ? (
              <Button
                type="button"
                variant={isPublished ? "outline" : "secondary"}
                size="sm"
                className="h-8 w-full justify-start gap-1.5 text-xs font-medium"
                onClick={() => onTogglePublish(a)}
              >
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </article>
  );
}

export const AssistantCard = memo(AssistantCardInner);
AssistantCard.displayName = "AssistantCard";
