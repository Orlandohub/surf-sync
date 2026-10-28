"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserType } from "@/lib/auth/session";
import { navItemsFor } from "@/components/shell/nav-items";
import { UnreadCount, UnreadDot } from "@/components/shell/unread-badge";

/**
 * Bottom tab bar (COMPONENTS.md "Bottom tab bar"), signed-in, < md only.
 * Fixed, `glass` (content scrolls under it), 56px + the home-indicator
 * inset. Icon 24px over a `text-caption` label; inactive muted, active
 * `text-primary` + semibold label — no pill, no filled glyph, no active dot.
 * Labels never hide: a label too wide for its cell (large text, 320px)
 * wraps — hyphenated where the browser can — instead of overlapping.
 * `unread` (unread notifications) shows as a "new activity" dot on the
 * icon of the item flagged `unread`; screen readers hear the count.
 *
 * Rendering it switches `--bottom-chrome` on (app/globals.css), which pads
 * the page and lifts toasts and pinned CTAs above it.
 */
export function BottomTabBar({ type, unread = 0 }: { type: UserType; unread?: number }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const items = navItemsFor(type);

  return (
    <nav
      aria-label={t("primary")}
      data-slot="tab-bar"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0! border-b-0! pb-(--safe-bottom) md:hidden"
    >
      <ul className="mx-auto flex min-h-tabbar max-w-lg items-stretch">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-caption text-muted-foreground outline-none",
                  "transition-colors duration-(--duration-fast) active:text-foreground",
                  "focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active && "font-semibold text-primary active:text-primary",
                )}
              >
                <span className="relative flex shrink-0">
                  <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.75} />
                  {item.unread && unread > 0 && (
                    <UnreadDot className="absolute -top-0.5 -right-0.5 ring-2 ring-card" />
                  )}
                </span>
                {/* Equal cells, no side padding; a label may borrow 4px of
                    each neighbour's room ("Disponibilidade" at 320–360px),
                    and wraps when even that is too narrow (large text). */}
                <span className="-mx-1 text-center leading-tight text-balance wrap-anywhere hyphens-auto">
                  {t(item.label)}
                  {item.unread && unread > 0 && <UnreadCount count={unread} />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
