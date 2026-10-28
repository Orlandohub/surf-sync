import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ReactivateButton } from "@/components/instructor/reactivate-button";

/**
 * Início when the instructor paused their profile: what that means and the
 * view's one primary. With availability left that's "Reativar perfil"
 * (applies immediately); with no days left, reactivating can't work yet,
 * so it says so and links to Disponibilidade.
 */
export function PausedNotice({ hasAvailability }: { hasAvailability: boolean }) {
  const t = useTranslations("InstructorHomePage.paused");

  return (
    <section
      aria-labelledby="perfil-pausado"
      className="flex flex-col gap-4 rounded-card border bg-card p-card shadow-card sm:flex-row sm:items-center sm:p-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
        <Pause aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="perfil-pausado" className="text-title-sm text-foreground">
          {t("title")}
        </h2>
        <p className="text-body text-muted-foreground">
          {hasAvailability ? t("description") : t("descriptionNoDays")}
        </p>
      </div>
      {hasAvailability ? (
        <ReactivateButton
          className="max-sm:items-stretch sm:max-w-xs sm:items-end"
          buttonClassName="max-sm:h-13"
        />
      ) : (
        <Link
          href="/instructor/availability"
          className={cn(buttonVariants(), "max-sm:h-13 max-sm:w-full")}
        >
          {t("setAvailability")}
          <ArrowRight aria-hidden strokeWidth={1.75} />
        </Link>
      )}
    </section>
  );
}
