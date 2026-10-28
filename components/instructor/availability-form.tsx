"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { saveAvailabilityAction, setPausedAction } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { PinnedCta } from "@/components/ui/pinned-cta";
import { toast } from "@/components/ui/toast";
import { SwitchRow } from "@/components/ui/switch";
import { DayChips } from "@/components/ui/chip-toggle-group";
import { TimeSelect } from "@/components/ui/time-select";
import { SectionHeading } from "@/components/ui/section-heading";
import { DAY_KEYS, formatSlot, weekdayName, type DayKey } from "@/lib/format";
import type { InstructorOnboarding } from "@/lib/services/instructor";

type Window = { start: string; end: string };

const DEFAULT_WINDOW: Window = { start: "09:00", end: "17:00" };

/**
 * Disponibilidade (deck screen 12): "Ativo" switch, weekday chips, and a
 * 24 h start–end window per chosen day. A form screen, so nothing applies
 * until "Guardar alterações": the weekly template is saved first, then the
 * pause/reactivate change (reactivating needs availability to exist).
 *
 * By status: active/inactive get the switch; incomplete is activated by
 * its first save (service rule), so it needs a day and says so;
 * pending_review/suspended can't toggle and save the hours only.
 */
export function AvailabilityForm({
  availability,
  status,
}: {
  availability: { dayOfWeek: DayKey; startTime: string; endTime: string }[];
  status: InstructorOnboarding["profileStatus"];
}) {
  const t = useTranslations("InstructorAvailabilityPage");
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  const [days, setDays] = useState<DayKey[]>(() =>
    DAY_KEYS.filter((d) => availability.some((a) => a.dayOfWeek === d)),
  );
  // Times are kept for every weekday, so switching a day off and on again
  // brings its hours back.
  const [windows, setWindows] = useState<Record<DayKey, Window>>(() => {
    const out = {} as Record<DayKey, Window>;
    for (const d of DAY_KEYS) {
      const a = availability.find((x) => x.dayOfWeek === d);
      out[d] = a ? { start: formatSlot(a.startTime), end: formatSlot(a.endTime) } : DEFAULT_WINDOW;
    }
    return out;
  });
  const canToggle = status === "active" || status === "inactive";
  // The first save of an incomplete profile activates it (service rule).
  const activates = status === "incomplete";
  const savedActive = status === "active";
  const [active, setActive] = useState(savedActive);
  // A save that changes the status (activating, pausing, reactivating)
  // comes back as a new `status`: the switch restarts from it. The form
  // isn't remounted for this, so the focused submit button keeps focus.
  const [syncedStatus, setSyncedStatus] = useState(status);
  if (status !== syncedStatus) {
    setSyncedStatus(status);
    setActive(status === "active");
  }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selected = DAY_KEYS.filter((d) => days.includes(d));
  const invalid = new Set(selected.filter((d) => windows[d].end <= windows[d].start));

  function setWindow(day: DayKey, patch: Partial<Window>) {
    setWindows((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setFormError(null);
  }

  /** Takes the person to what needs fixing, centred clear of the pinned bar. */
  function focusFirst(selector: string) {
    requestAnimationFrame(() => {
      const control = formRef.current?.querySelector<HTMLElement>(selector);
      control?.focus({ preventScroll: true });
      control?.scrollIntoView({ block: "center" });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (invalid.size > 0) {
      setFormError(t("errors.invalid"));
      focusFirst("select[aria-invalid=true]");
      return;
    }
    // Being visible (or becoming visible) needs at least one day: the first
    // save that activates, reactivating, and staying active.
    if (selected.length === 0 && (activates || (canToggle && active))) {
      setFormError(
        activates
          ? t("errors.activateNeedsDays")
          : savedActive
            ? t("errors.activeNeedsDays")
            : t("errors.reactivateNeedsDays"),
      );
      focusFirst("[data-slot=chip-toggle-group] button");
      return;
    }

    setSaving(true);
    const saved = await saveAvailabilityAction({
      slots: selected.map((d) => ({
        dayOfWeek: d,
        startTime: windows[d].start,
        endTime: windows[d].end,
      })),
    });
    if (!saved.ok) {
      setSaving(false);
      setFormError(saved.error);
      return;
    }
    const toggles = canToggle && active !== savedActive;
    if (toggles) {
      const toggled = await setPausedAction(!active);
      if (!toggled.ok) {
        setSaving(false);
        setFormError(toggled.error);
        router.refresh();
        return;
      }
    }
    setSaving(false);
    toast(activates ? t("activated") : toggles ? t(active ? "reactivated" : "paused") : t("saved"));
    startTransition(() => router.refresh());
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-section"
    >
      <div className="grid grid-cols-1 items-start gap-section lg:grid-cols-2">
        <div className="flex flex-col gap-section">
          <section aria-labelledby="visibilidade" className="flex flex-col gap-3">
            <SectionHeading id="visibilidade" title={t("active.title")} />
            <div className="rounded-card border bg-card px-card shadow-card">
              {canToggle ? (
                <SwitchRow
                  label={t("active.label")}
                  // The saved state, or what saving will do while it differs:
                  // nothing applies before "Guardar alterações".
                  description={
                    active === savedActive
                      ? active
                        ? t("active.on")
                        : t("active.off")
                      : active
                        ? t("active.willActivate")
                        : t("active.willPause")
                  }
                  checked={active}
                  onCheckedChange={(checked) => {
                    setActive(checked);
                    setFormError(null);
                  }}
                />
              ) : (
                <p className="flex min-h-13 items-center gap-3 py-3 text-body text-muted-foreground">
                  <Info aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
                  {status === "pending_review"
                    ? t("active.pending_review")
                    : status === "suspended"
                      ? t("active.suspended")
                      : t("active.incomplete")}
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="dias" className="flex flex-col gap-3">
            <SectionHeading id="dias" title={t("days.label")} />
            <DayChips
              aria-labelledby="dias"
              aria-describedby={selected.length === 0 ? "dias-ajuda" : undefined}
              value={days}
              onValueChange={(next) => {
                setDays(next);
                setFormError(null);
              }}
            />
            {selected.length === 0 && (
              <p id="dias-ajuda" className="text-meta text-muted-foreground">
                {t("days.none")}
              </p>
            )}
          </section>
        </div>

        <section aria-labelledby="horarios" className="flex flex-col gap-3">
          <SectionHeading id="horarios" title={t("hours.title")} />
          {selected.length > 0 ? (
            <ul role="list" className="overflow-hidden rounded-card border bg-card shadow-card">
              {selected.map((day) => (
                <DayWindow
                  key={day}
                  day={day}
                  window={windows[day]}
                  invalid={invalid.has(day)}
                  onChange={(patch) => setWindow(day, patch)}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-card border border-dashed px-card py-6 text-center text-body text-muted-foreground">
              {t("hours.empty")}
            </p>
          )}
        </section>
      </div>

      {/* The screen's one primary, pinned above the tab bar on phones and tablets. */}
      <PinnedCta until="lg" error={formError}>
        <Button
          type="submit"
          size="lg"
          pending={saving || refreshing}
          pendingLabel={t("saving")}
          className="md:w-auto lg:h-11"
        >
          {activates ? t("saveActivate") : t("save")}
        </Button>
      </PinnedCta>
    </form>
  );
}

function DayWindow({
  day,
  window,
  invalid,
  onChange,
}: {
  day: DayKey;
  window: Window;
  invalid: boolean;
  onChange: (patch: Partial<Window>) => void;
}) {
  const t = useTranslations("InstructorAvailabilityPage.hours");
  const id = useId();
  const labelId = `${id}-day`;
  const errorId = `${id}-error`;
  return (
    // A size container: the day and its two times share a line while they
    // fit, and stack as the text grows (rem-based, so 200% text counts) —
    // never squeezing a time to "09:…".
    <li className="@container relative flex flex-col gap-2 px-card py-3 not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-card not-first:before:h-px not-first:before:bg-border">
      <div className="flex flex-col gap-2 @md:flex-row @md:items-center @md:gap-4">
        <span id={labelId} className="text-label text-foreground @md:w-24 @md:shrink-0">
          {weekdayName(day)}
        </span>
        <div
          role="group"
          aria-labelledby={labelId}
          className="flex min-w-0 flex-1 flex-col gap-2 @3xs:flex-row @3xs:items-center"
        >
          <Field label={t("start", { day: weekdayName(day) })} hideLabel className="flex-1">
            <TimeSelect
              value={window.start}
              onChange={(e) => onChange({ start: e.target.value })}
              selectClassName="h-11"
            />
          </Field>
          <span aria-hidden className="text-body text-muted-foreground @max-3xs:hidden">
            –
          </span>
          <Field label={t("end", { day: weekdayName(day) })} hideLabel className="flex-1">
            <TimeSelect
              value={window.end}
              onChange={(e) => onChange({ end: e.target.value })}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              selectClassName="h-11"
            />
          </Field>
        </div>
      </div>
      {invalid && (
        <FieldError id={errorId} className="@md:pl-28">
          {t("endBeforeStart")}
        </FieldError>
      )}
    </li>
  );
}
