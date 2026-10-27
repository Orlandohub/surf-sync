"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserType } from "@/lib/auth/session";
import { navItemsFor } from "@/components/shell/nav-items";

/**
 * Bottom tab bar (COMPONENTS.md "Bottom tab bar"), signed-in, < md only.
 * Fixed, `glass` (content scrolls under it), 56px + the home-indicator
 * inset. Icon 24px over a `text-caption` label; inactive muted, active
 * `text-primary` + semibold label — no pill, no filled glyph, no dot.
 * Labels never hide.
 *
 * Rendering it switches `--bottom-chrome` on (app/globals.css), which pads
 * the page and lifts toasts and pinned CTAs above it.
 */
export function BottomTabBar({ type }: { type: UserType }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const items = navItemsFor(type);

  return (
    <nav
      aria-label={t("primary")}
      data-slot="tab-bar"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-(--safe-bottom) md:hidden"
    >
      <ul className="mx-auto flex h-tabbar max-w-lg items-stretch px-1">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-caption text-muted-foreground outline-none",
                  "transition-colors duration-(--duration-fast) active:text-foreground",
                  "focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active && "font-semibold text-primary active:text-primary",
                )}
              >
                <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.75} />
                {/* Equal cells; a long label ("Disponibilidade") may spill into its neighbours' padding at 360px rather than truncate. */}
                <span className="whitespace-nowrap">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
