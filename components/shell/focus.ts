/**
 * Keeps keyboard focus somewhere sensible when an in-place action removes
 * the control that had it (cancelling a booking moves its row to
 * Histórico, unsaving in Guardados drops the row, "Marcar tudo como lido"
 * hides itself). Waits — across the router.refresh() — until `el` is gone,
 * then, if focus fell back to <body>, moves it to `fallback()` without
 * scrolling. Gives up after `timeout` ms if `el` stays (nothing to fix).
 *
 * The fallback should be a stable element with tabIndex={-1}: the list's
 * heading or section, which screen readers announce in context.
 */
export function refocusWhenRemoved(
  el: Element | null | undefined,
  fallback: () => HTMLElement | null | undefined,
  timeout = 10_000,
): void {
  if (!el || typeof window === "undefined") return;
  const started = performance.now();
  const tick = () => {
    if (el.isConnected) {
      if (performance.now() - started < timeout) requestAnimationFrame(tick);
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    fallback()?.focus({ preventScroll: true });
  };
  requestAnimationFrame(tick);
}

/** A refocusWhenRemoved fallback: the element with this id (give it tabIndex={-1}). */
export const byId = (id: string) => () => document.getElementById(id);
