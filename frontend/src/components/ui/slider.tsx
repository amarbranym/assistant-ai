import * as React from "react";

import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<"input">, "type"> & {
  "aria-valuetext"?: string;
  /** Smaller track + thumb for dense layouts */
  compact?: boolean;
};

function Slider({
  className,
  compact,
  min = 0,
  max = 100,
  value,
  defaultValue,
  ...props
}: SliderProps) {
  const minN = Number(min);
  const maxN = Number(max);
  const valN =
    value !== undefined && value !== ""
      ? Number(value)
      : defaultValue !== undefined && defaultValue !== ""
        ? Number(defaultValue)
        : minN;
  const pct =
    maxN > minN
      ? Math.min(100, Math.max(0, ((valN - minN) / (maxN - minN)) * 100))
      : 0;

  return (
    <input
      type="range"
      data-slot="slider"
      data-compact={compact ? true : undefined}
      min={min}
      max={max}
      value={value}
      defaultValue={defaultValue}
      style={
        {
          "--slider-fill": `${pct}%`,
        } as React.CSSProperties
      }
      className={cn(
        "focus-control h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
        compact && "h-5",
        className
      )}
      {...props}
    />
  );
}

export { Slider };
