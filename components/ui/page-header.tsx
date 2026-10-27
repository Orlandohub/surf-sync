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
 *     title={instructor.displayName}
 *     action={<Button variant="outline" size="sm">Guardar</Button>}
 *   />
 *
 * One trailing action at most; more goes in a menu.
 */
function PageHeader({
  title,
  description,
  back,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Where "back" goes, and its label (the parent page's name). */
  back?: { href: string; label: string }
  action?: React.ReactNode
  className?: string
}) {
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-headline text-balance text-foreground">{title}</h1>
          {description && (
            <p className="max-w-prose text-body text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center pt-0.5">{action}</div>}
      </div>
    </header>
  )
}

export { PageHeader }
