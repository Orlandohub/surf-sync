import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { InstructorOnboarding, OnboardingStep } from "@/lib/services/instructor";

/** The steps that activate the profile, in order, and where each is done. */
const STEP_HREF = {
  complete_profile: "/instructor/profile",
  set_availability: "/instructor/availability",
} as const;

type ActivationKey = keyof typeof STEP_HREF;
type ActivationStep = OnboardingStep & { key: ActivationKey };

const isActivationStep = (step: OnboardingStep): step is ActivationStep => step.key in STEP_HREF;

type StepState = "done" | "current" | "later";

/**
 * Início for a brand-new instructor: the steps that put the profile in the
 * schools' search — complete the profile, then set availability — with
 * progress. The current step's button is the view's one primary; the step
 * after it waits, muted. Confirming the email isn't one of them (the
 * services activate the profile without it), so it isn't counted here:
 * <EmailNotice> asks for it separately, and keeps asking after the
 * profile is active.
 */
export function OnboardingChecklist({
  onboarding,
  className,
}: {
  onboarding: InstructorOnboarding;
  className?: string;
}) {
  const t = useTranslations("InstructorHomePage.onboarding");
  const steps = onboarding.steps.filter(isActivationStep);
  const done = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done);
  const progress = t("progress", { done, total: steps.length });

  const stateOf = (step: ActivationStep): StepState =>
    step.done ? "done" : step.key === current?.key ? "current" : "later";

  return (
    <section
      aria-labelledby="ativar-perfil"
      className={cn(
        "flex flex-col overflow-hidden rounded-card border bg-card shadow-card",
        className,
      )}
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
            aria-labelledby="ativar-perfil"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={done}
            aria-valuetext={progress}
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
          const state = stateOf(step);
          return (
            <li
              key={step.key}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "relative flex min-h-18 items-start gap-3 px-card py-4 sm:px-6",
                "not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-16 not-first:before:h-px not-first:before:bg-border sm:not-first:before:left-18",
              )}
            >
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
              <span className="flex min-h-9 min-w-0 flex-1 flex-col justify-center gap-0.5">
                <span
                  className={cn(
                    "text-label",
                    state === "later" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {t(`steps.${step.key}.title`)}
                </span>
                <span className="text-meta text-muted-foreground">
                  {state === "done"
                    ? t(`steps.${step.key}.doneDescription`)
                    : t(`steps.${step.key}.description`)}
                </span>
              </span>
              {step.done && (
                <span className="flex min-h-9 shrink-0 items-center text-meta text-muted-foreground">
                  {t("done")}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {current && (
        <div className="border-t p-card sm:px-6">
          <Link
            href={STEP_HREF[current.key]}
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
