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
import { UnreadCount, UnreadDot } from "@/components/shell/unread-badge";
import { homeHrefFor, navItemsFor } from "@/components/shell/nav-items";

// The hairline appears once content scrolls under the bar.
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
// …and signed-out people away from these: reaching one with no `user`
// means a session started behind the layout (signing up, then following
// a client link into the app).
const SIGNED_IN_ONLY = ["/instructor", "/school", "/account"];
const under = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * App bar (COMPONENTS.md "App bar"), sticky, `--top-chrome` tall.
 *
 * Signed in — desktop: lockup, the primary links (active = teal + 2px
 * underline), account menu. Mobile: lockup + account menu only; the links
 * move to the bottom tab bar.
 * Anonymous — logo, quiet "Entrar", small primary "Criar conta" (on the
 * landing; elsewhere both are quiet, the page has its own primary). Below
 * 640px the lockup shrinks to the mark so all three fit at 360px.
 *
 * Surface: an opaque canvas bar that gains a hairline once content scrolls
 * under it. Not glass: over the landing's ink panels and photos the blur
 * turned into a muddy band with dark smudges past the panels' corners,
 * and over the light product pages glass looked the same as opaque.
 *
 * Large text: the header is a size container, and its breakpoints are in
 * rem, so they follow the text size (media queries don't). Below 16rem
 * (a phone at 150% text and up) it keeps the mark and one action: the
 * account menu, or "Entrar". On desktop below 42rem (tablets at 125%+)
 * the lockup becomes the mark and the gaps tighten; if the links still
 * don't fit (200% at 768–1000px), they scroll sideways inside the bar
 * instead of widening the page.
 *
 * `user` comes from the server (root layout), so the first paint is
 * already right — no client session fetch, no flash. The root layout isn't
 * re-rendered on client navigation, so the header refreshes once when it
 * is out of date: a "signed-in" header on /sign-in or /sign-up (session
 * revoked elsewhere), or a signed-out one inside /instructor, /school or
 * /account (a session that started after the layout rendered, e.g. right
 * after sign-up), which also brings the tab bar back.
 *
 * `unread` (unread notifications) shows as a "new activity" dot on the
 * item flagged `unread` in nav-items.ts; screen readers hear the count.
 * It updates with the layout — `router.refresh()` after marking
 * notifications read.
 */
export function SiteHeader({ user, unread = 0 }: { user: ShellUser | null; unread?: number }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled);
  const items = user ? navItemsFor(user.type).filter((item) => item.desktop) : [];

  const refreshedFor = useRef<string | null>(null);
  const stale = user
    ? SIGNED_OUT_ONLY.includes(pathname)
    : SIGNED_IN_ONLY.some((base) => under(pathname, base));
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
        "@container sticky top-0 z-40 h-(--top-chrome) border-b bg-background transition-colors duration-(--duration-fast) ease-move",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-4 px-gutter @2xl:gap-8">
        <Link
          href={user ? homeHrefFor(user.type) : "/"}
          aria-label={t("home")}
          // Padded so the focus ring clears the lockup (DESIGN.md §10 clear space).
          className="tap -mx-2 flex shrink-0 items-center rounded-control p-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {user ? (
            <>
              <LogoMark size={28} className="hidden @max-3xs:block md:@max-2xl:block" />
              <LogoLockup height={24} className="@max-3xs:hidden md:@max-2xl:hidden" />
            </>
          ) : (
            <>
              <LogoMark size={28} className="sm:hidden" />
              <LogoLockup height={24} className="max-sm:hidden" />
            </>
          )}
        </Link>

        {items.length > 0 && (
          <nav aria-label={t("primary")} className="hidden h-full min-w-0 overflow-x-auto overscroll-x-contain md:block">
            <ul className="flex h-full min-w-max items-stretch gap-1">
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
                      <span className="relative">
                        <StableLabel>{t(item.label)}</StableLabel>
                        {item.unread && unread > 0 && <UnreadDot className="absolute -top-0.5 -right-2.5" />}
                      </span>
                      {item.unread && unread > 0 && <UnreadCount count={unread} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {user ? <AccountMenu user={user} /> : <AnonymousActions pathname={pathname} quietOnly={pathname !== "/"} />}
        </div>
      </div>
    </header>
  );
}

function AnonymousActions({ pathname, quietOnly }: { pathname: string; quietOnly: boolean }) {
  const t = useTranslations("Nav");
  const quiet = buttonVariants({ variant: "ghost", size: "sm" });

  if (quietOnly && !AUTH_PATHS.includes(pathname)) {
    // The filled "Criar conta" belongs to the landing. Any other page a
    // signed-out person can reach (today the 404) has its own primary
    // ("Voltar ao início"), so both ways in stay, quiet.
    return (
      <>
        <Link href="/sign-in" className={quiet}>
          {t("signIn")}
        </Link>
        <Link href="/sign-up" className={cn(quiet, "@max-3xs:hidden")}>
          {t("signUp")}
        </Link>
      </>
    );
  }

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

  // At large text on a phone (header under 16rem) only "Entrar" stays:
  // the shorter of the two, and the way back for people who have an
  // account. "Criar conta" is the landing hero's primary action.
  return (
    <>
      <Link href="/sign-in" className={quiet}>
        {t("signIn")}
      </Link>
      <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "@max-3xs:hidden")}>
        {t("signUp")}
      </Link>
    </>
  );
}
