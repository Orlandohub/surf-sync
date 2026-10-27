import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  StableLabel,
  tabsListClassName,
  tabsTriggerClassName,
} from "@/components/ui/tab-styles"

/**
 * surfsync DS (COMPONENTS.md "Tabs") — underline tabs driven by the URL.
 * Same look as <Tabs>, but each tab is a link, so the selection survives
 * reloads, can be shared, and lets a Server Component filter the data.
 * Server-component friendly (no client JS of its own).
 *
 *   // app/instructor/bookings/page.tsx
 *   const tab = (await searchParams).tab === "history" ? "history" : "upcoming"
 *   <LinkTabs
 *     label="Aulas"
 *     value={tab}
 *     items={[
 *       { value: "upcoming", href: "/instructor/bookings", label: "Próximas" },
 *       { value: "history", href: "/instructor/bookings?tab=history", label: "Histórico", badge: <Badge variant="count">2</Badge> },
 *     ]}
 *   />
 *
 * The page decides which tab is active (`value`) — from searchParams or the
 * pathname. Links keep the scroll position by default (`scroll={false}`).
 */
type LinkTabItem = {
  value: string
  href: string
  label: string
  /** Trailing count or badge, e.g. <Badge variant="count">2</Badge>. */
  badge?: React.ReactNode
}

function LinkTabs({
  items,
  value,
  label,
  scroll = false,
  className,
}: {
  items: readonly LinkTabItem[]
  /** The active item's value. */
  value: string
  /** Accessible name of the tab navigation. */
  label: string
  /** Scroll to top on change. Off by default (tabs swap content in place). */
  scroll?: boolean
  className?: string
}) {
  return (
    <nav aria-label={label} data-slot="link-tabs" className={className}>
      <ul className={tabsListClassName}>
        {items.map((item) => {
          const active = item.value === value
          return (
            <li key={item.value} className="flex flex-1 md:flex-none">
              <Link
                href={item.href}
                scroll={scroll}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tabsTriggerClassName,
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity after:duration-(--duration-base)",
                  active && "after:opacity-100"
                )}
              >
                <StableLabel>{item.label}</StableLabel>
                {item.badge}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { LinkTabs, type LinkTabItem }
