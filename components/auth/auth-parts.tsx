import * as React from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

/**
 * Small presentational pieces shared by the auth screens. No hooks, no
 * directive: usable from Server and Client Components alike.
 */

/**
 * Teal text link (forgot password, "Criar conta" after a lead). For links
 * set inside running text (e.g. inside a field error) — it has no touch
 * extension, which would cover the control above.
 */
export const authTextLinkClass =
  "rounded-chip font-medium text-primary underline-offset-4 outline-none hover:underline " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * A standalone text link: the `tap` utility extends its 18px line to a
 * 44px touch target (DESIGN.md §7 "Touch"). Keep ≥ 13px clear above and
 * below it.
 */
export const authStandaloneLinkClass = `tap ${authTextLinkClass}`;

/**
 * The quiet way out at the end of an auth form:
 * "Ainda não tens conta? Criar conta".
 *
 * `reload`: a plain <a> (full navigation) instead of a client transition —
 * for leaving an auth screen right after the session changed, so the
 * server-rendered app bar picks up the new session.
 */
export function AuthAltLink({
  lead,
  href,
  reload = false,
  children,
  className,
}: {
  lead?: React.ReactNode;
  href: string;
  reload?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-meta text-muted-foreground", className)}>
      {lead && <>{lead} </>}
      {reload ? (
        <a href={href} className={authStandaloneLinkClass}>
          {children}
        </a>
      ) : (
        <Link href={href} className={authStandaloneLinkClass}>
          {children}
        </Link>
      )}
    </p>
  );
}

/**
 * The 48px circle above a state screen's title (email sent, link
 * expired, email confirmed). Status tones carry state only and always sit
 * next to a title that says it in words (DESIGN.md C7).
 */
export function AuthStateIcon({
  icon: Icon,
  tone = "default",
}: {
  icon: IconComponent;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 items-center justify-center rounded-full",
        tone === "success" && "bg-success-soft text-success-soft-foreground",
        tone === "warning" && "bg-warning-soft text-warning-soft-foreground",
        tone === "default" && "bg-tint text-tint-foreground",
      )}
    >
      <Icon className="size-6" strokeWidth={1.75} />
    </span>
  );
}

/** A confirmation shown above a form (e.g. after a password reset). */
export function AuthNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-control bg-success-soft px-4 py-3 text-meta text-success-soft-foreground",
        className,
      )}
    >
      <CircleCheck aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}
