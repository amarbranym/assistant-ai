"use client";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOGGLE_CLASS =
  "text-muted-foreground hover:text-foreground pointer-events-auto absolute top-1/2 right-0.5 z-10 -translate-y-1/2 transition-none active:-translate-y-1/2 [&_svg]:pointer-events-auto";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete: string;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  toggleAriaLabelWhenHidden: string;
  toggleAriaLabelWhenVisible: string;
};

/** Password input with show/hide toggle (avoids global `Button` active nudge on icons). */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
  show,
  onToggleShow,
  toggleAriaLabelWhenHidden,
  toggleAriaLabelWhenVisible,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={TOGGLE_CLASS}
          disabled={disabled}
          aria-label={show ? toggleAriaLabelWhenVisible : toggleAriaLabelWhenHidden}
          onClick={onToggleShow}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
