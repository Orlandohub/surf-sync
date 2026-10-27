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

/**
 * Rounded marketing panel. `tone="ink"` is the Azul Atlântico panel.
 * It does not clip its content, so text that grows (browser text size at
 * 150–200 %) wraps instead of being cut off; only the MarkBackdrop layer
 * is clipped to the panel's corners.
 */
export function Panel({ tone, children }: { tone: "ink" | "card"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative isolate mx-auto w-full max-w-7xl rounded-panel",
        tone === "ink" ? "bg-inverse text-inverse-foreground" : "border bg-card text-card-foreground shadow-card",
      )}
    >
      {children}
    </div>
  );
}

/** Wrapping for BD Sans display lines: hyphenate (html lang is pt-PT), else break the word. */
export const displayWrap = "hyphens-auto wrap-break-word";

/**
 * Section title in BD Sans: lowercase, weight 400, 32 px on phones and
 * 48 px from md (never below 24 px, DESIGN.md T2). Petrol teal on light
 * surfaces, brand teal on ink (5.7:1). Long words hyphenate (or break)
 * rather than overflow when the browser's text size is raised.
 */
export function DisplayHeading({
  tone = "light",
  className,
  ...props
}: React.ComponentProps<"h2"> & { tone?: "light" | "ink" }) {
  return (
    <h2
      className={cn(
        displayWrap,
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
 * background device for brand surfaces (DESIGN.md §10). Use it as the
 * first child of a <Panel>: it fills the panel in its own layer, clipped
 * to the panel's corners, behind the content. Position the mark with
 * `className` (size + offsets + colour).
 */
export function MarkBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-panel">
      <LogoMark className={cn("absolute select-none", className)} />
    </div>
  );
}

/**
 * One feature line: tint icon circle, title, one or two sentences. When
 * the text column would drop below 10rem (large browser text on a phone)
 * the text wraps under the icon instead of squeezing or overflowing.
 */
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
    <li className="flex min-w-0 flex-wrap gap-4">
      {icon}
      <div className="flex min-w-0 grow basis-40 flex-col gap-1 pt-0.5">
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
