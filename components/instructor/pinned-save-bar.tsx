"use client";

import { useEffect, useRef } from "react";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/field";

/**
 * Put on the content that scrolls under a PinnedSaveBar (its siblings):
 * focused controls then stop above the bar, not only above the tab bar
 * (WCAG 2.4.11). The bar writes its own height to `--save-bar` on its
 * parent; the shell's scroll-margin rule only knows about the tab bar.
 */
export const CLEARS_SAVE_BAR =
  "max-lg:**:scroll-mb-[calc(var(--bottom-chrome)+var(--save-bar,5rem)+0.5rem)]";

/**
 * The form screens' one primary ("Guardar alterações"), pinned above the
 * tab bar on phones and tablets, static at the end of the form from lg.
 * A form-level error sits next to the button. Keep the bar the last child
 * of its parent and put CLEARS_SAVE_BAR on the siblings it covers.
 *
 * Area workaround: the shell doesn't know about pinned CTAs yet (toast
 * offset, scroll margin), reported in foundation_issues.
 */
export function PinnedSaveBar({
  error,
  children,
  className,
}: {
  /** Form-level error (role="alert"); render-only while there is one. */
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    const parent = bar?.parentElement;
    if (!bar || !parent) return;
    const update = () => parent.style.setProperty("--save-bar", `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      parent.style.removeProperty("--save-bar");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-slot="pinned-save-bar"
      className={cn(
        "sticky bottom-(--bottom-chrome) z-10 -mx-gutter flex flex-col gap-3 border-t bg-background px-gutter pt-3 pb-4",
        "md:flex-row md:items-center md:justify-end lg:static lg:mx-0 lg:border-0 lg:p-0",
        className,
      )}
    >
      {error && <FieldError className="md:mr-auto">{error}</FieldError>}
      {children}
    </div>
  );
}

/**
 * The save confirmation, lifted above the pinned bar while it is pinned
 * so it never covers the button (the shell's toast sits right above the
 * tab bar). Same look and rules as `toast()` from components/ui/toast.
 */
export function toastAboveSaveBar(
  message: React.ReactNode,
  options: { action?: { label: React.ReactNode; onClick: () => void } } = {},
) {
  const bar = document.querySelector<HTMLElement>("[data-slot=pinned-save-bar]");
  const style = bar ? getComputedStyle(bar) : null;
  // Toasts sit just above the bottom chrome (the sticky bar's own `bottom`).
  // Lift them by however much of the bar is above that line: the bar's
  // height while it's pinned, more when a short page leaves it higher up.
  const lift =
    bar && style?.position === "sticky"
      ? Math.max(0, innerHeight - parseFloat(style.bottom) - bar.getBoundingClientRect().top)
      : 0;
  const { action } = options;
  return sonnerToast(message, {
    action: action ? { label: action.label, onClick: () => action.onClick() } : undefined,
    style: lift > 0 ? { marginBottom: lift } : undefined,
  });
}
