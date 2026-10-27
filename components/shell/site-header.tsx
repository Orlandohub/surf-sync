"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogoLockup, LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { StableLabel } from "@/components/ui/tab-styles";
import { cn } from "@/lib/utils";
import type { ShellUser } from "@/lib/auth/session";
import { AccountMenu } from "@/components/shell/account-menu";
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
 * already right — no client session fetch, no flash.
 */
export function SiteHeader({ user }: { user: ShellUser | null }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled);
  const items = user ? navItemsFor(user.type).filter((item) => item.desktop) : [];

  return (
    <header
      data-slot="app-bar"
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-(--duration-fast) ease-move",
        scrolled ? "glass" : "border border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-(--top-chrome) w-full max-w-5xl items-center gap-8 px-gutter">
        <Link
          href={user ? homeHrefFor(user.type) : "/"}
          aria-label={t("home")}
          className="tap flex shrink-0 items-center rounded-chip text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
