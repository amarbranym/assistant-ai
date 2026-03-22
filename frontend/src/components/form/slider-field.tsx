import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type SliderFieldProps = {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  /** Optional suffix after min/max (e.g. unit) */
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  /** Smaller typography + compact slider */
  compact?: boolean;
};

export function SliderField({
  id,
  label,
  description,
  error,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  disabled,
  formatValue = (v) => v.toFixed(2),
  className,
  minLabel,
  maxLabel,
  compact,
}: SliderFieldProps) {
  return (
    <div className={cn(compact ? "space-y-1" : "space-y-1.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label
            htmlFor={id}
            className={cn(
              "text-foreground font-medium",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {label}
          </Label>
          {description ? (
            <p
              className={cn(
                "text-muted-foreground leading-relaxed",
                compact ? "mt-0.5 text-[0.65rem]" : "mt-1 text-xs",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "text-foreground font-medium tabular-nums",
            compact ? "text-xs" : "text-sm",
          )}
          aria-live="polite"
        >
          {formatValue(value)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        compact={compact}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        className="w-full"
      />
      <div
        className={cn(
          "text-muted-foreground flex justify-between tabular-nums leading-none",
          compact ? "text-[0.6rem]" : "text-[0.65rem]",
        )}
      >
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
