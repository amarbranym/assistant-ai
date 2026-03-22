import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthFormLayoutProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: {
    text: string;
    href: string;
    linkLabel: string;
  };
};

export function AuthFormLayout({
  title,
  description,
  children,
  footer,
}: AuthFormLayoutProps) {
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <Link
          href="/assistants"
          className="text-primary hover:text-primary/85 inline-block font-mono text-xs font-semibold tracking-widest uppercase"
        >
          Assistant
        </Link>
        <h1 className="font-heading text-foreground mt-4 text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {children}
      <p
        className={cn(
          "text-muted-foreground mt-8 text-center text-sm",
        )}
      >
        {footer.text}{" "}
        <Link
          href={footer.href}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
