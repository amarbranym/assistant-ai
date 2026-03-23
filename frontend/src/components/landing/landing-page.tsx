import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { features, pricing, stats, testimonials } from "./data";

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-2xl text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs uppercase tracking-[0.2em]">
          {eyebrow}
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      <div className="mt-8 lg:mt-10">{children}</div>
    </section>
  );
}

export function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_srgb,var(--primary)_20%,transparent)_0%,transparent_40%),radial-gradient(circle_at_80%_10%,color-mix(in_srgb,var(--chart-3)_18%,transparent)_0%,transparent_44%),linear-gradient(to_bottom,color-mix(in_srgb,var(--background)_88%,black_12%),var(--background))]" />
      <div className="bg-grid-futuristic pointer-events-none absolute inset-0 -z-10 opacity-30" />
      <div className="aurora-orb pointer-events-none absolute -left-32 top-20 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="aurora-orb pointer-events-none absolute -right-28 top-72 -z-10 h-80 w-80 rounded-full bg-chart-3/15 blur-3xl [animation-delay:700ms]" />
      <div className="aurora-orb pointer-events-none absolute bottom-20 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-chart-4/10 blur-3xl [animation-delay:1200ms]" />

      <header className="sticky top-0 z-20 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-2xl border border-border/50 bg-background/65 px-4 py-3 shadow-theme backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-md bg-primary/15 p-1 text-primary ring-1 ring-primary/30">
            <Sparkles className="size-4" />
          </span>
          Nimbus
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/sign-in" />} variant="ghost" size="sm">
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />} size="sm">
            Get Started
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6 md:pt-16 lg:px-8 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <Badge className="w-fit px-3 py-1 text-xs uppercase tracking-[0.2em]">
              Premium Voice Experience
            </Badge>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-6xl">
              Create phone assistants for your business, without coding.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Nimbus helps you set up helpful voice assistants in plain language. No technical
              setup, no confusing screens - just simple steps and clear results.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="shadow-theme transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start Free <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href="#features" />}
                variant="outline"
                size="lg"
                className="backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              >
                See How It Works
              </Button>
            </div>
          </div>

          <Card className="float-soft animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 border border-border/60 bg-card/70 shadow-theme backdrop-blur-md">
            <CardHeader>
              <CardTitle>Simple Daily Overview</CardTitle>
              <CardDescription>
                A clear view so you always know what is happening.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border/70 bg-background/75 p-3 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="mt-1 text-sm font-medium">6 calls handled</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/75 p-3 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-xs text-muted-foreground">Customer replies</p>
                <p className="mt-1 text-sm font-medium">+18% this week</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/75 p-3 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-medium">Everything running smoothly</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((item, index) => (
            <Card
              key={item.label}
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-4 duration-700 border border-border/60 bg-card/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-1 hover:ring-primary/35",
                index % 2 === 0 ? "delay-100" : "delay-200"
              )}
            >
              <CardContent className="py-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SectionShell
        id="features"
        eyebrow="How It Helps"
        title="Made to be simple from your first day"
        description="Every part is written for normal users, not just technical teams."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={cn(
                "group h-full animate-in fade-in-0 slide-in-from-bottom-4 duration-700 border border-border/60 bg-card/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-1 hover:ring-primary/35",
                index < 3 ? "delay-100" : "delay-200"
              )}
            >
              <CardHeader>
                <CardTitle className="transition-colors duration-300 group-hover:text-primary">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        id="pricing"
        eyebrow="Pricing"
        title="Simple plans for every stage"
        description="Clear prices, no surprises."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {pricing.map((tier, index) => (
            <Card
              key={tier.name}
              className={cn(
                "h-full animate-in fade-in-0 slide-in-from-bottom-4 duration-700 border border-border/60 bg-card/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1",
                tier.highlighted && "ring-2 ring-primary/35 shadow-theme",
                index === 1 ? "delay-100" : "delay-200"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  {tier.highlighted ? <Badge>Popular</Badge> : null}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <p className="pt-2 text-2xl font-semibold">{tier.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tier.features.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full transition-transform duration-300 hover:-translate-y-0.5"
                  variant={tier.highlighted ? "default" : "outline"}
                  render={<Link href="/sign-up" />}
                >
                  Choose {tier.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        id="testimonials"
        eyebrow="Customer Stories"
        title="Loved by business owners and creators"
        description="Real words from people who wanted something simple."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <Card
              key={item.name}
              className={cn(
                "h-full animate-in fade-in-0 slide-in-from-bottom-4 duration-700 border border-border/60 bg-card/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-1 hover:ring-primary/35",
                index === 1 ? "delay-100" : "delay-200"
              )}
            >
              <CardContent className="flex h-full flex-col justify-between gap-5 py-1">
                <p className="text-sm text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionShell>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 border border-border/60 bg-card/75 shadow-theme backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-between gap-4 py-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-lg font-semibold">Ready to set up your first voice assistant?</p>
              <p className="text-sm text-muted-foreground">
                Start in minutes and keep your customer calls running with less effort.
              </p>
            </div>
            <Button
              render={<Link href="/sign-up" />}
              size="lg"
              className="transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start For Free
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
