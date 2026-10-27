import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md) — Button.
 * One filled primary per view; arrows only on forward navigation.
 *
 * Pending: pass `pending` and switch the label to the gerund yourself
 * ("A guardar…"). The button shows a spinner, is disabled but keeps focus,
 * and is marked aria-busy. Don't render a leading icon while pending.
 *
 * A link that looks like a button: style a Next <Link> with
 * `buttonVariants({ variant, size })` — don't nest a <button> in an <a>.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control text-label outline-none select-none " +
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
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and blocks clicks while an action runs. */
    pending?: boolean
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      focusableWhenDisabled={pending || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {pending && (
        <LoaderCircle aria-hidden strokeWidth={1.75} className="animate-spin" />
      )}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
