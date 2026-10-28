"use client";

import * as React from "react";
import { PageHeaderFocus } from "@/components/ui/page-header";

/**
 * The column of an auth result screen (email sent, link no longer valid,
 * email confirmed): the state icon and PageHeader first, then actions.
 *
 * `focusOnMount`: when the screen replaces a form the person just
 * submitted, the focused submit button disappears with the form. Focus
 * then moves to the screen's h1 (PageHeaderFocus), so keyboard users
 * continue from here and screen readers announce the new state. Leave it
 * off when the screen is the page itself (a fresh load starts at the top
 * anyway).
 */
export function AuthStateScreen({
  focusOnMount = false,
  children,
}: {
  focusOnMount?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="auth-state" className="flex flex-col gap-8">
      <PageHeaderFocus enabled={focusOnMount}>{children}</PageHeaderFocus>
    </div>
  );
}
