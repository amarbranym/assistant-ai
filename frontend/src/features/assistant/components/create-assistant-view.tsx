"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ASSISTANTS_ROUTE } from "../lib/constants";
import { CreateAssistantForm } from "./create-assistant/create-assistant-form";

export function CreateAssistantView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardPageHeader title="Create assistant" description="Configure your assistant in one form. Submit when you’re ready." />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
          <CreateAssistantForm />
        </div>
      </div>
    </div>
  );
}
