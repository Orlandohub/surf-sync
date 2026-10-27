import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { InstructorOnboarding, OnboardingStep } from "@/lib/services/instructor";

const STEP_HREF: Partial<Record<OnboardingStep["key"], string>> = {
  complete_profile: "/instructor/profile",
  set_availability: "/instructor/availability",
};

/**
 * Início for a brand-new instructor: the three activation steps with
 * progress. Done steps show a check; the current step is a link (and the
 * view's one primary action); later steps wait, muted, until it's done.
 */
export function OnboardingChecklist({ onboarding }: { onboarding: InstructorOnboarding }) {
  const t = useTranslations("InstructorHomePage.onboarding");
  const steps = onboarding.steps;
  const done = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done);
  const currentHref = current ? STEP_HREF[current.key] : undefined;
  const progress = t("progress", { done, total: steps.length });

  return (
    <section
      aria-labelledby="ativar-perfil"
      className="flex flex-col overflow-hidden rounded-card border bg-card shadow-card"
    >
      <div className="flex flex-col gap-4 p-card sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 id="ativar-perfil" className="text-title text-foreground">
            {t("title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("description", { remaining: steps.length - done })}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label={progress}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={done}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-(--duration-base) ease-move"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
          <p aria-hidden className="text-meta text-muted-foreground tabular-nums">
            {progress}
          </p>
        </div>
      </div>

      <ol role="list" className="border-t">
        {steps.map((step, i) => {
          const isCurrent = step.key === current?.key;
          const href = isCurrent ? STEP_HREF[step.key] : undefined;
          const state = step.done ? "done" : isCurrent ? "current" : "later";
          const body = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-label tabular-nums",
                  state === "done" && "bg-tint text-tint-foreground",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "later" && "border border-border text-muted-foreground",
                )}
              >
                {step.done ? <Check className="size-5" strokeWidth={1.75} /> : i + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-label",
                    state === "later" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {t(`steps.${step.key}.title`)}
                </span>
                <span className="text-meta text-muted-foreground">
                  {t(`steps.${step.key}.${step.done ? "doneDescription" : "description"}`)}
                </span>
              </span>
              {step.done ? (
                <span className="shrink-0 text-meta text-muted-foreground">{t("done")}</span>
              ) : href ? (
                <ChevronRight
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              ) : null}
            </>
          );
          const rowClass = "flex min-h-18 items-center gap-3 px-card py-3 sm:px-6";
          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className="relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-16 not-first:before:h-px not-first:before:bg-border sm:not-first:before:left-18"
            >
              {href ? (
                <Link
                  href={href}
                  className={cn(
                    rowClass,
                    "transition-colors duration-(--duration-fast) hover:bg-accent/50",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>

      {current && currentHref && (
        <div className="border-t p-card sm:px-6">
          <Link
            href={currentHref}
            className={cn(buttonVariants({ size: "lg" }), "sm:h-11 sm:w-auto")}
          >
            {t(`steps.${current.key}.title`)}
            <ArrowRight aria-hidden strokeWidth={1.75} />
          </Link>
        </div>
      )}
    </section>
  );
}
