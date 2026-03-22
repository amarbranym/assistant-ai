"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

/**
 * Password field with a show/hide toggle (does not replace RHF `register` spread).
 */
export function PasswordInput({ className, disabled, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        {...(typeof id === "string" && id ? { "aria-controls": id } : {})}
      >
        {visible ? (
          <EyeOff className="size-4 shrink-0" aria-hidden />
        ) : (
          <Eye className="size-4 shrink-0" aria-hidden />
        )}
      </Button>
    </div>
  );
}
