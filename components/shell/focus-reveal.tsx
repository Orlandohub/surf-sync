"use client";

import { useEffect } from "react";

/** Form controls whose focus scrolling we check. */
const FIELD = "input, textarea, select, [role='combobox'], [contenteditable='true']";

/**
 * Keeps a focused form field clear of the bars, app-wide (WCAG 2.4.11).
 * Mounted once in app/layout.tsx; renders nothing.
 *
 * globals.css gives everything in #conteudo a scroll-margin of top bar /
 * bottom clearance (tab bar + pinned CTA), but Chrome ignores it when a
 * text field gets focus: it only scrolls the caret into view, so a field
 * can sit under the tab bar or a pinned CTA with its caret "visible".
 * After focus lands (by Tab, a tap or focus()), if the field is not fully
 * inside the margins, scrollIntoView({ block: "nearest" }) moves it just
 * far enough; that call does honour scroll-margin. A field that already
 * fits never moves.
 *
 * Only fields inside #conteudo (dialogs and the bars have their own
 * layout), and only on :focus-visible: a select or select trigger opened
 * with the mouse is left alone, since moving the page under an open
 * picker would misplace it (text fields match :focus-visible on any
 * focus, so a tapped field is still revealed). Code that focuses a field
 * and scrolls it itself (focus({ preventScroll }) + scrollIntoView) wins:
 * the check runs a frame later and finds the field in view.
 */
export function FocusReveal() {
  useEffect(() => {
    let frame = 0;

    function onFocusIn(event: FocusEvent) {
      const el = event.target;
      if (!(el instanceof HTMLElement) || !el.matches(FIELD) || !el.closest("#conteudo")) return;
      cancelAnimationFrame(frame);
      // After the browser's own focus scrolling.
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== el || !el.matches(":focus-visible")) return;
        const margin = getComputedStyle(el);
        const top = parseFloat(margin.scrollMarginTop) || 0;
        const bottom = document.documentElement.clientHeight - (parseFloat(margin.scrollMarginBottom) || 0);
        const rect = el.getBoundingClientRect();
        if (rect.top < top || rect.bottom > bottom) el.scrollIntoView({ block: "nearest" });
      });
    }

    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
