"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogoLockup, LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { StableLabel } from "@/components/ui/tab-styles";
import { cn } from "@/lib/utils";
import type { ShellUser } from "@/lib/auth/session";
import { AccountMenu } from "@/components/shell/account-menu";
import { UnreadBadge } from "@/components/shell/unread-badge";
import { homeHrefFor, navItemsFor } from "@/components/shell/nav-items";

// Glass only once content scrolls under the bar (DESIGN.md G1).
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const isScrolled = () => window.scrollY > 4;
const notScrolled = () => false;

// Auth screens carry their own primary action; the bar stays quiet there.
const AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];
// The server redirects signed-in people away from these, so reaching one
// with a `user` means the root layout's session is stale.
const SIGNED_OUT_ONLY = ["/sign-in", "/sign-up"];

/**
 * App bar (COMPONENTS.md "App bar"), sticky, `--top-chrome` tall.
 *
 * Signed in — desktop: lockup, the primary links (active = teal + 2px
 * underline), account menu. Mobile: lockup + account menu only; the links
 * move to the bottom tab bar.
 * Anonymous — logo, quiet "Entrar", small primary "Criar conta". Below
 * 640px the lockup shrinks to the mark so all three fit at 360px.
 *
 * `user` comes from the server (root layout), so the first paint is
 * already right — no client session fetch, no flash. The root layout isn't
 * re-rendered on client navigation: if a soft redirect lands a "signed-in"
 * header on /sign-in (session revoked elsewhere), it refreshes once.
 *
 * `unread` (unread notifications) shows as a count on the item flagged
 * `unread` in nav-items.ts. It updates with the layout — `router.refresh()`
 * after marking notifications read.
 */
export function SiteHeader({ user, unread = 0 }: { user: ShellUser | null; unread?: number }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled);
  const items = user ? navItemsFor(user.type).filter((item) => item.desktop) : [];

  const refreshedFor = useRef<string | null>(null);
  const stale = !!user && SIGNED_OUT_ONLY.includes(pathname);
  useEffect(() => {
    if (!stale || refreshedFor.current === pathname) return;
    refreshedFor.current = pathname;
    router.refresh();
  }, [stale, pathname, router]);

  return (
    <header
      data-slot="app-bar"
      className={cn(
        // Exactly --top-chrome tall, bottom hairline included (border-box),
        // so sticky sub-headers at top-(--top-chrome) meet it flush.
        "sticky top-0 z-40 h-(--top-chrome) border-b transition-[background-color,border-color,box-shadow] duration-(--duration-fast) ease-move",
        scrolled ? "glass border-x-0! border-t-0!" : "border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-8 px-gutter">
        <Link
          href={user ? homeHrefFor(user.type) : "/"}
          aria-label={t("home")}
          // Padded so the focus ring clears the lockup (DESIGN.md §10 clear space).
          className="tap -mx-2 flex shrink-0 items-center rounded-control p-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {user ? (
            <LogoLockup height={24} />
          ) : (
            <>
              <LogoMark size={28} className="sm:hidden" />
              <LogoLockup height={24} className="max-sm:hidden" />
            </>
          )}
        </Link>

        {items.length > 0 && (
          <nav aria-label={t("primary")} className="hidden h-full md:block">
            <ul className="flex h-full items-stretch gap-1">
              {items.map((item) => {
                const active = item.match(pathname);
                return (
                  <li key={item.key} className="flex">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center px-3 text-label font-medium text-muted-foreground outline-none",
                        "transition-colors duration-(--duration-fast) hover:text-foreground",
                        "focus-visible:rounded-chip focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity after:duration-(--duration-base)",
                        active && "font-semibold text-primary after:opacity-100",
                      )}
                    >
                      <StableLabel>{t(item.label)}</StableLabel>
                      {item.unread && unread > 0 && <UnreadBadge count={unread} className="ml-1.5" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          {user ? <AccountMenu user={user} /> : <AnonymousActions pathname={pathname} />}
        </div>
      </div>
    </header>
  );
}

function AnonymousActions({ pathname }: { pathname: string }) {
  const t = useTranslations("Nav");
  const quiet = buttonVariants({ variant: "ghost", size: "sm" });

  if (AUTH_PATHS.includes(pathname)) {
    // One quiet way out of the current auth screen.
    return pathname === "/sign-in" ? (
      <Link href="/sign-up" className={quiet}>
        {t("signUp")}
      </Link>
    ) : (
      <Link href="/sign-in" className={quiet}>
        {t("signIn")}
      </Link>
    );
  }

  return (
    <>
      <Link href="/sign-in" className={quiet}>
        {t("signIn")}
      </Link>
      <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
        {t("signUp")}
      </Link>
    </>
  );
}
