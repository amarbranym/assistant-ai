"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableComboboxOption = {
  value: string;
  label: string;
};

type SearchableComboboxProps = {
  id?: string;
  options: SearchableComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
};

type PanelPosition = { top: number; left: number; width: number };

function consumeSuppress(
  ref: MutableRefObject<boolean>,
  e: { preventDefault: () => void; stopPropagation: () => void }
) {
  if (!ref.current) return false;
  e.preventDefault();
  e.stopPropagation();
  ref.current = false;
  return true;
}

export function SearchableCombobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Search…",
  disabled,
  "aria-describedby": ariaDescribedBy,
}: SearchableComboboxProps) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const inputId = id ?? `${autoId}-input`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelPos, setPanelPos] = useState<PanelPosition>({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** After outside close, same gesture can “click” the trigger underneath — swallow once. */
  const suppressNextTriggerRef = useRef(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 192),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const ro = new ResizeObserver(updatePanelPosition);
    const t = triggerRef.current;
    if (t) ro.observe(t);
    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    function onPointerDownCapture(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      suppressNextTriggerRef.current = true;
      close();
      window.setTimeout(() => {
        if (suppressNextTriggerRef.current) suppressNextTriggerRef.current = false;
      }, 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  function handleTriggerPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    consumeSuppress(suppressNextTriggerRef, e);
  }

  function handleTriggerClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (consumeSuppress(suppressNextTriggerRef, e)) return;
    e.stopPropagation();
    let nextOpen = false;
    setOpen((prev) => {
      nextOpen = !prev;
      return nextOpen;
    });
    if (nextOpen) setQuery("");
  }

  const dropdown = open ? (
    <div
      ref={panelRef}
      className="border-border bg-popover text-popover-foreground shadow-theme fixed z-100 flex max-h-72 min-w-48 flex-col overflow-hidden rounded-lg border"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
      }}
      role="presentation"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="border-border border-b p-1.5">
        <Input
          type="search"
          autoComplete="off"
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 text-sm"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-labelledby={inputId}
        className="max-h-48 overflow-y-auto p-1"
      >
        {filtered.length === 0 ? (
          <li className="text-muted-foreground px-2 py-2 text-sm">
            No matches
          </li>
        ) : (
          filtered.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={cn(
                  "hover:bg-muted focus:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  opt.value === value &&
                    "bg-primary/10 text-primary font-medium"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  close();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        id={inputId}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-describedby={ariaDescribedBy}
        onPointerDown={handleTriggerPointerDown}
        onClick={handleTriggerClick}
        className="focus-control border-input bg-background text-foreground flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
