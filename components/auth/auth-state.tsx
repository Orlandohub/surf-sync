"use client";

import * as React from "react";

/**
 * The column of an auth result screen (email sent, link no longer valid,
 * email confirmed): the state icon and PageHeader first, then actions.
 *
 * `focusOnMount`: when the screen replaces a form the person just
 * submitted, the focused submit button disappears with the form. Focus
 * then moves to the screen's h1, so keyboard users continue from here and
 * screen readers announce the new state. Leave it off when the screen is
 * the page itself (a fresh load starts at the top anyway).
 *
 * PageHeader doesn't take a ref, so the h1 is found in the DOM; it gets
 * tabIndex=-1 (focusable from script only) and no focus ring, since it
 * isn't a control.
 */
export function AuthStateScreen({
  focusOnMount = false,
  children,
}: {
  focusOnMount?: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!focusOnMount) return;
    const heading = ref.current?.querySelector("h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [focusOnMount]);

  return (
    <div ref={ref} data-slot="auth-state" className="flex flex-col gap-8 [&_h1]:outline-none">
      {children}
    </div>
  );
}
