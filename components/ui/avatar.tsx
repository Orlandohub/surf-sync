import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * surfsync DS (COMPONENTS.md "Avatar & stack").
 * Circle. Real photo when there is one, otherwise initials in
 * `text-tint-foreground` on `bg-tint` (never an illustrated avatar).
 *
 * Sizes: 32 (rows, stacks, nav) · 44 (messages) · 88 (profile, matching)
 * · 96 (profile hero).
 *
 *   <Avatar name="Ana Marques" />                       // initials "AM"
 *   <Avatar name={school.name} src={school.logoUrl} size={88} />
 *
 * Decorative by default (the name is next to it). Standing alone, pass
 * `label` so it is announced. A verified badge goes after the name, not on
 * the avatar.
 */
const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-tint align-middle font-semibold text-tint-foreground",
  {
    variants: {
      size: {
        32: "size-8 text-caption font-semibold",
        44: "size-11 text-label",
        88: "size-22 text-headline",
        96: "size-24 text-headline",
      },
    },
    defaultVariants: { size: 44 },
  }
)

type AvatarSize = 32 | 44 | 88 | 96

const NAME_PARTICLES = new Set(["de", "da", "do", "das", "dos", "e", "d'"])

/** "Ana Marques" → "AM", "Rui" → "R", "Inês de Sousa" → "IS". */
function getInitials(name: string | null | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !NAME_PARTICLES.has(w.toLocaleLowerCase("pt-PT")))
  if (words.length === 0) return ""
  const first = Array.from(words[0])[0] ?? ""
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : ""
  return (first + last).toLocaleUpperCase("pt-PT")
}

function Avatar({
  name,
  src,
  size = 44,
  label,
  className,
}: {
  /** Used for the initials fallback. */
  name: string | null | undefined
  /** Photo URL. Falls back to initials while loading or on error. */
  src?: string | null
  size?: AvatarSize
  /** Accessible name when the avatar stands alone. Omit when decorative. */
  label?: string
  className?: string
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback className="leading-none">
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

/**
 * Overlapping faces: max 4, then a "+N" circle. Each face gets a card
 * ring so it separates from its neighbour.
 */
function AvatarStack({
  people,
  max = 4,
  size = 32,
  label,
  className,
}: {
  people: { name: string; src?: string | null }[]
  max?: number
  size?: AvatarSize
  /** Accessible summary, e.g. "4 participantes". */
  label?: string
  className?: string
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <div
      data-slot="avatar-stack"
      className={cn("flex items-center -space-x-2", className)}
      {...(label ? { role: "img", "aria-label": label } : {})}
    >
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} size={size} className="ring-2 ring-card" />
      ))}
      {rest > 0 && (
        <span
          aria-hidden
          className={cn(
            avatarVariants({ size }),
            "bg-muted text-caption font-semibold text-muted-foreground tabular-nums ring-2 ring-card"
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  )
}

export { Avatar, AvatarStack, avatarVariants, getInitials }
