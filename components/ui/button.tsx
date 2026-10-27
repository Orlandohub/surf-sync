import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md) — Button.
 * One filled primary per view; arrows only on forward navigation.
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
