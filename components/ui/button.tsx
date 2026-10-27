import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md) — Button.
 * One filled primary per view; arrows only on forward navigation.
 *
 * Pending: pass `pending` and the gerund as `pendingLabel` — don't swap
 * the children yourself:
 *
 *   <Button pending={saving} pendingLabel="A guardar…">Guardar alterações</Button>
 *
 * Both labels share one grid cell, so the button is as wide as the longer
 * one from the start and never jumps; while pending the spinner and the
 * gerund replace the children (leading icon included). Without
 * `pendingLabel` the label stays (hidden) to hold the width and the
 * spinner sits centred over it. The button is disabled but keeps focus,
 * and is marked aria-busy.
 *
 * `variant="link"` is an inline text link (no height or padding, whatever
 * the size) — for a section's "Ver todas" prefer <SectionLink>.
 * A link that looks like a button: style a Next <Link> with
 * `buttonVariants({ variant, size })` — don't nest a <button> in an <a>.
 */
// Never wider than its container, and its label wraps rather than being
// clipped (a lone "Cancelar pedido" or "Voltar ao início" at 200% text on a
// phone). The size's height stays the minimum: min-h-min lets two lines
// grow the button past it; one line looks exactly as before.
const buttonVariants = cva(
  "inline-flex max-w-full min-h-min shrink-0 items-center justify-center gap-2 py-1.5 text-center rounded-control text-label outline-none select-none " +
  "transition-[color,background-color,border-color,transform] duration-(--duration-fast) ease-move active:scale-98 " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-40 aria-invalid:ring-2 aria-invalid:ring-destructive " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        outline: "border border-input bg-card text-foreground hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-tint",
        ghost: "text-foreground hover:bg-accent",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        glass: "glass text-foreground hover:bg-card",
      },
      size: {
        sm: "tap h-9 px-3 text-meta font-semibold",
        default: "h-11 px-5",
        lg: "h-13 w-full px-6",
        icon: "size-11 rounded-full",
        "icon-sm": "tap size-9 rounded-full",
      },
    },
    // A text link keeps its text box whatever the size: no height, no
    // padding; it wraps like text ("Marcar tudo como lido" at 200%).
    compoundVariants: [{ variant: "link", className: "h-auto px-0 py-0 text-left" }],
    defaultVariants: { variant: "default", size: "default" },
  }
)

const layer = "inline-flex items-center justify-center gap-2"

function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  pendingLabel,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and blocks clicks while an action runs. */
    pending?: boolean
    /** The gerund shown while pending ("A guardar…"). */
    pendingLabel?: React.ReactNode
  }) {
  let content: React.ReactNode = children
  if (pendingLabel !== undefined) {
    content = (
      <span data-slot="button-label" className="grid place-items-center *:col-start-1 *:row-start-1">
        <span className={cn(layer, pending && "invisible")}>{children}</span>
        <span className={cn(layer, !pending && "invisible")}>
          <LoaderCircle aria-hidden strokeWidth={1.75} className={cn(pending && "animate-spin")} />
          {pendingLabel}
        </span>
      </span>
    )
  } else if (pending) {
    content = (
      <>
        <span className={cn(layer, "invisible")}>{children}</span>
        <LoaderCircle aria-hidden strokeWidth={1.75} className="absolute inset-0 m-auto animate-spin" />
      </>
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      focusableWhenDisabled={pending || undefined}
      className={cn(buttonVariants({ variant, size, className }), pending && pendingLabel === undefined && "relative")}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
