import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * COMPONENTS.md "Avatar & stack": BadgeCheck after an instructor's name,
 * never on the avatar. Inline, so it follows the last word when a long
 * name wraps (large text) instead of jumping to the far edge; put it right
 * after the name, inside the same heading or line:
 *
 *   <h1>{name}{verified && <VerifiedMark className="size-5" />}</h1>
 *
 * Read as part of the name: "Ana Marques, Identidade verificada".
 * `className` sizes the icon (size-4 by default; size-5 in a page title).
 */
export function VerifiedMark({ className }: { className?: string }) {
  const t = useTranslations("UI");
  return (
    <>
      <span className="sr-only">, {t("verified")}</span>
      <span aria-hidden className="ms-1.5 inline-flex align-middle">
        <BadgeCheck strokeWidth={1.75} className={cn("size-4 shrink-0 text-primary", className)} />
      </span>
    </>
  );
}
