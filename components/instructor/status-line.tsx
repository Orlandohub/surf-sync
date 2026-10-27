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
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          (status === null || status === "incomplete") && "bg-control-off",
          status === "active" && "bg-success",
          (status === "inactive" || status === "pending_review") && "bg-warning",
          status === "suspended" && "bg-destructive",
        )}
      />
      {t(status ?? "incomplete")}
    </span>
  );
}
