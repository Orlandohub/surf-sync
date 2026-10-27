import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge only recognises Tailwind's stock scale names. Without this,
// it reads the design-system type roles (`text-meta`, `text-label`…) as text
// *colours* and silently drops whichever of `text-meta` / `text-primary-
// foreground` comes first — e.g. small buttons lost their white label.
// Keep these lists in sync with the @theme tokens in app/globals.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "caption",
        "meta",
        "body",
        "body-lg",
        "label",
        "title-sm",
        "title",
        "headline",
        "display-sm",
        "display",
        "display-lg",
        "display-xl",
      ],
      radius: ["chip", "thumb", "control", "card", "sheet", "panel"],
      shadow: ["card", "float", "overlay"],
      spacing: ["gutter", "card", "stack", "section", "tap"],
      ease: ["enter", "move", "exit"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
