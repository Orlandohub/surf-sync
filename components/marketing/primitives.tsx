import * as React from "react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Building blocks of the public landing page — a brand surface
 * (DESIGN.md "Brand at the edges", COMPONENTS.md "Marketing / web").
 * BD Sans display type and the cropped wave mark live here and nowhere
 * in the product screens.
 */

/** Text column, aligned with the app bar's (max-w-5xl + screen gutter). */
export const marketingColumn = "mx-auto w-full max-w-5xl px-gutter";

/** Vertical rhythm between landing sections. */
export const marketingSection = "py-16 md:py-24";

/**
 * Outer frame of a panel: a small inset from the viewport edge so the
 * rounded corners read on phones. Panels break out of the text column
 * (up to 1280 px); their content goes back into `marketingColumn`.
 */
export function PanelFrame({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn("px-2 sm:px-4", className)} {...props}>
      {children}
    </section>
  );
}

/** Rounded marketing panel. `tone="ink"` is the Azul Atlântico panel. */
export function Panel({
  tone,
  className,
  children,
}: {
  tone: "ink" | "card";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate mx-auto w-full max-w-7xl overflow-hidden rounded-panel",
        tone === "ink" ? "bg-inverse text-inverse-foreground" : "border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section title in BD Sans: lowercase, weight 400, 32 px on phones and
 * 48 px from md (never below 24 px, DESIGN.md T2). Petrol teal on light
 * surfaces, brand teal on ink (5.7:1).
 */
export function DisplayHeading({
  as: Tag = "h2",
  tone = "light",
  className,
  ...props
}: React.ComponentProps<"h2"> & {
  as?: "h1" | "h2";
  tone?: "light" | "ink";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-display-sm text-balance lowercase md:text-display",
        tone === "light" ? "text-primary" : "text-brand",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The oversized, cropped wave mark at very low contrast — the deck's
 * background device for brand surfaces (DESIGN.md §10). Place it inside a
 * `relative isolate overflow-hidden` parent and position it with
 * `className` (size + offsets + colour).
 */
export function MarkBackdrop({ className }: { className?: string }) {
  return (
    <LogoMark
      className={cn("pointer-events-none absolute -z-10 select-none", className)}
    />
  );
}

/** One feature line: tint icon circle, title, one or two sentences. */
export function FeatureItem({
  icon,
  title,
  description,
  tone = "light",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  tone?: "light" | "ink";
}) {
  return (
    <li className="flex gap-4">
      {icon}
      <div className="flex min-w-0 flex-col gap-1 pt-0.5">
        <h3 className="text-label">{title}</h3>
        <p
          className={cn(
            "max-w-prose text-body",
            tone === "light" ? "text-muted-foreground" : "text-inverse-foreground/70",
          )}
        >
          {description}
        </p>
      </div>
    </li>
  );
}
