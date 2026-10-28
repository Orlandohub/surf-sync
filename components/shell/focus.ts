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

const ROW_CONTROL = "button:not(:disabled), a[href]";

/**
 * Where focus goes when an in-place action takes its row out of a list
 * (a cancelled lesson leaves Próximas, an answered request leaves
 * Pedidos), the same on both bookings screens: the next row's first
 * control, else the previous row's, else the list section's current tab,
 * else its first heading. Keyboard users cancelling several items keep
 * their place.
 *
 * Call it with the action's control while its row is still there (it
 * notes the neighbours then). The returned function picks the target once
 * the list has re-rendered, or returns null when the section is gone too.
 *
 *   const target = planRowFocus(button);   // before the refresh
 *   refocusWhenRemoved(button, () => target() ?? byId("lista")());
 */
export function planRowFocus(control: Element | null | undefined): () => HTMLElement | null {
  const row = control?.closest("li") ?? null;
  const neighbours = [row?.nextElementSibling, row?.previousElementSibling];
  const section = row?.closest("section") ?? null;
  return () => {
    for (const neighbour of neighbours) {
      const next = neighbour?.isConnected ? neighbour.querySelector<HTMLElement>(ROW_CONTROL) : null;
      if (next) return next;
    }
    if (!section?.isConnected) return null;
    const landmark =
      section.querySelector<HTMLElement>("[aria-current=page]") ??
      section.querySelector<HTMLElement>("h2, h3");
    if (landmark && !landmark.matches(ROW_CONTROL)) landmark.tabIndex = -1;
    return landmark;
  };
}
