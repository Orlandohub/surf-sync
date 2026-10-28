"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "App bar") — the top of every product page.
 * Title `text-headline` (the page's one h1), optional one-line
 * description, optional back link above, optional single trailing action.
 * No eyebrow line above the title — the nav already says where you are.
 *
 *   <PageHeader title="As tuas aulas" description="Pedidos de escolas e aulas confirmadas." />
 *   <PageHeader
 *     back={{ href: "/school/discovery", label: "Instrutores" }}
 *     leading={<Avatar name={instructor.displayName} size={88} />}
 *     title={instructor.displayName}
 *     description={instructor.locations.join(", ")}
 *     action={<BookmarkToggle … />}
 *   >
 *     <LevelBadge level={instructor.experienceLevel} />
 *   </PageHeader>
 *
 * - `leading`: an avatar or logo beside the title block — level with the
 *   title on phones, centred on the block from md. When the title can't
 *   have 11rem beside it (large text), it moves under the avatar. For a
 *   smaller one on phones pass both sizes (`<Avatar size={44}
 *   className="md:hidden" />` + `<Avatar size={88} className="max-md:hidden" />`).
 * - `children`: a badge row under the description.
 * - `action`: one at most; more goes in a menu. By default it sits at the
 *   end of the title row (an icon button, a small outline button), and
 *   wraps under the header when the title can't keep 12rem beside it (a
 *   long name, large text). With `stackAction` it drops under the header,
 *   full width, below 640px — for a labelled primary such as "Encontrar
 *   instrutores".
 * - The title wraps (balanced); a single word wider than the line breaks.
 *   Never truncate a page title.
 * - Focus: the h1 is focusable from script (tabIndex -1, no ring, not in
 *   the Tab order). `focusOnMount` moves focus to it when the header
 *   mounts — for a result screen that replaces the form someone just
 *   submitted (the submit button is gone, so focus would fall to <body>).
 *   Never on a page's own first render: that would skip the navigation.
 *   A whole result screen can opt in with <PageHeaderFocus>. `headingRef`
 *   hands the h1 to a client component that focuses it itself.
 *
 * A client component (for the focus handling); Server Components render
 * it with plain props and server-rendered nodes as before.
 */
function PageHeader({
  title,
  description,
  back,
  leading,
  action,
  stackAction = false,
  focusOnMount,
  headingRef,
  children,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Where "back" goes, and its label (the parent page's name). */
  back?: { href: string; label: string }
  /** Avatar or logo beside the title block. */
  leading?: React.ReactNode
  action?: React.ReactNode
  /** Below 640px the action takes its own full-width row under the header. */
  stackAction?: boolean
  /** Focus the h1 when the header mounts (result screens only). */
  focusOnMount?: boolean
  headingRef?: React.Ref<HTMLHeadingElement>
  /** Badge row under the description. */
  children?: React.ReactNode
  className?: string
}) {
  const inherited = React.useContext(FocusOnMountContext)
  const shouldFocus = focusOnMount ?? inherited
  const ownRef = React.useRef<HTMLHeadingElement>(null)
  // Hands the h1 to the caller's ref (attached before this runs).
  React.useImperativeHandle(headingRef, () => ownRef.current as HTMLHeadingElement, [])

  React.useEffect(() => {
    if (shouldFocus) ownRef.current?.focus()
  }, [shouldFocus])

  // In a row with an action, the title block (or the avatar + title) asks
  // for 12rem; when the row can't give it that beside the action (a long
  // name, 200% text), the action wraps under the header instead of
  // squeezing the title into a sliver.
  const inRow = !stackAction && action != null
  const titleBlock = (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        // Beside an avatar it needs 11rem, else it drops under it (a long
        // name at large text on a phone) rather than breaking every word.
        leading ? "grow basis-44" : inRow && "grow basis-48"
      )}
    >
      {/* A word wider than the line (a long name at 200% text) breaks
          rather than running out of the header. */}
      <h1
        ref={ownRef}
        tabIndex={-1}
        className="text-headline text-balance wrap-break-word hyphens-auto text-foreground outline-none"
      >
        {title}
      </h1>
      {description && (
        <p className="max-w-prose text-body text-pretty text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-1 flex flex-wrap items-center gap-1.5">{children}</div>}
    </div>
  )

  return (
    <header data-slot="page-header" className={cn("flex flex-col gap-3", className)}>
      {back && (
        <Link
          href={back.href}
          className="tap -ml-1 inline-flex w-fit items-center gap-0.5 rounded-chip text-meta font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {back.label}
        </Link>
      )}
      <div
        className={cn(
          "flex",
          stackAction
            ? "flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            : cn(
                "flex-wrap justify-between gap-x-4 gap-y-3",
                leading ? "items-start md:items-center" : "items-start"
              )
        )}
      >
        {leading ? (
          <div
            className={cn(
              "flex min-w-0 grow flex-wrap items-start gap-4 md:items-center md:gap-5",
              inRow && "basis-48"
            )}
          >
            <div className="flex shrink-0">{leading}</div>
            {titleBlock}
          </div>
        ) : (
          titleBlock
        )}
        {action && (
          <div
            className={cn(
              "flex shrink-0 items-center",
              stackAction ? "max-sm:*:w-full" : !leading && "pt-0.5"
            )}
          >
            {action}
          </div>
        )}
      </div>
    </header>
  )
}

const FocusOnMountContext = React.createContext(false)

/**
 * Wraps a result screen that replaces a form (e.g. "Verifica o teu
 * email"): the PageHeader inside focuses its h1 when it mounts, as if it
 * had `focusOnMount`. `enabled={false}` turns it off (the same screen
 * rendered as a page of its own).
 */
function PageHeaderFocus({
  enabled = true,
  children,
}: {
  enabled?: boolean
  children: React.ReactNode
}) {
  return <FocusOnMountContext.Provider value={enabled}>{children}</FocusOnMountContext.Provider>
}

export { PageHeader, PageHeaderFocus }
