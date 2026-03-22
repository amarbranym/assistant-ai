export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center p-4 md:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.08] via-transparent to-accent/30"
        aria-hidden
      />
      <div className="relative w-full max-w-[440px]">{children}</div>
    </div>
  );
}
