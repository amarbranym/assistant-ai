import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </Label>
      {description ? (
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
