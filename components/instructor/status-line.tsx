import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { InstructorOnboarding } from "@/lib/services/instructor";

/**
 * The one status line under the Início greeting: a state dot (colour
 * paired with the words, never alone) and where the profile stands.
 */
export function StatusLine({ onboarding }: { onboarding: InstructorOnboarding }) {
  const t = useTranslations("InstructorHomePage.status");
  const status = onboarding.profileStatus;

  return (
    <span className="inline-flex items-start gap-2">
      {/* One line tall, so the dot stays on the first line when the text wraps. */}
      <span aria-hidden className="flex h-lh shrink-0 items-center">
        <span
          className={cn(
            "size-2 rounded-full",
            (status === null || status === "incomplete") && "bg-control-off",
            status === "active" && "bg-success",
            (status === "inactive" || status === "pending_review") && "bg-warning",
            status === "suspended" && "bg-destructive",
          )}
        />
      </span>
      {t(status ?? "incomplete")}
    </span>
  );
}
