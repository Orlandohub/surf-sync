import * as React from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { IconComponent } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

/**
 * Small presentational pieces shared by the auth screens. No hooks, no
 * directive: usable from Server and Client Components alike.
 */

/** Teal inline text link (forgot password, "Criar conta" in a sentence). */
export const authTextLinkClass =
  "rounded-chip font-medium text-primary underline-offset-4 outline-none hover:underline " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * The quiet way out at the end of an auth form:
 * "Ainda não tens conta? Criar conta".
 */
export function AuthAltLink({
  lead,
  href,
  children,
  className,
}: {
  lead?: React.ReactNode;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-meta text-muted-foreground", className)}>
      {lead && <>{lead} </>}
      <Link href={href} className={authTextLinkClass}>
        {children}
      </Link>
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
