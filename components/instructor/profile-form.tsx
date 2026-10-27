"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveProfileAction } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipToggleGroup } from "@/components/ui/chip-toggle-group";
import { PinnedCta } from "@/components/ui/pinned-cta";
import { toast } from "@/components/ui/toast";

const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export type Level = (typeof LEVELS)[number];

type Errors = Partial<Record<"displayName" | "level" | "zones", string>>;

/**
 * Perfil form: name, bio, level (one of), zones (any of). Inline errors
 * say what to fix; the save button is the screen's one primary, pinned
 * above the tab bar on phones and tablets (PinnedCta). `aside` (the
 * Perfil menu) sits beside the form on desktop and after it on phones.
 * A first-time profile says "Guardar perfil" and its toast goes straight
 * to the next step.
 */
export function ProfileForm({
  initial,
  locations,
  hasAvailability,
  isNew,
  aside,
}: {
  initial: { displayName: string; bio: string; level: Level | null; locationIds: string[] };
  locations: { id: string; name: string }[];
  hasAvailability: boolean;
  /** No profile saved yet. */
  isNew: boolean;
  aside?: React.ReactNode;
}) {
  const t = useTranslations("InstructorProfilePage");
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [level, setLevel] = useState<Level[]>(initial.level ? [initial.level] : []);
  const [zones, setZones] = useState<string[]>(initial.locationIds);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();

  function clear(field: keyof Errors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const next: Errors = {};
    if (displayName.trim().length < 2) next.displayName = t("form.displayNameError");
    if (level.length === 0) next.level = t("form.levelError");
    if (zones.length === 0) next.zones = t("form.zonesError");
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Take the person to the first thing to fix (after the errors render).
      // Centred, so the error under it clears the pinned save bar.
      requestAnimationFrame(() => {
        const control = formRef.current?.querySelector<HTMLElement>(
          "[data-slot=field][data-invalid] :is(input, textarea, button)",
        );
        control?.focus({ preventScroll: true });
        control?.closest("[data-slot=field]")?.scrollIntoView({ block: "center" });
      });
      return;
    }

    setSaving(true);
    const res = await saveProfileAction({
      displayName: displayName.trim(),
      bio: bio.trim(),
      experienceLevel: level[0],
      locationIds: zones,
    });
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast(
      isNew ? t("form.created") : t("form.saved"),
      hasAvailability
        ? undefined
        : {
            action: {
              label: t("form.nextStep"),
              onClick: () => router.push("/instructor/availability"),
            },
          },
    );
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid items-start gap-section lg:grid-cols-3">
      <form
        id={formId}
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="lg:col-span-2"
      >
        <section
          aria-labelledby="os-teus-dados"
          className="flex flex-col gap-6 rounded-card border bg-card p-card shadow-card sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="os-teus-dados" className="text-title-sm text-foreground">
              {t("form.title")}
            </h2>
            <p className="text-meta text-muted-foreground">{t("form.description")}</p>
          </div>

          <Field
            label={t("form.displayName")}
            helper={t("form.displayNameHelper")}
            error={errors.displayName}
          >
            <Input
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                clear("displayName");
              }}
              maxLength={80}
              required
            />
          </Field>

          <Field label={t("form.bio")} helper={t("form.bioHelper")}>
            <Textarea
              name="bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setFormError(null);
              }}
              maxLength={2000}
              rows={4}
            />
          </Field>

          <Field label={t("form.level")} group error={errors.level}>
            <ChipToggleGroup<Level>
              multiple={false}
              required
              options={LEVELS.map((value) => ({ value, label: t(`levels.${value}`) }))}
              value={level}
              onValueChange={(next) => {
                setLevel(next);
                clear("level");
              }}
            />
          </Field>

          <Field label={t("form.zones")} group helper={t("form.zonesHelper")} error={errors.zones}>
            <ChipToggleGroup
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
              value={zones}
              onValueChange={(next) => {
                setZones(next);
                clear("zones");
              }}
            />
          </Field>
        </section>
      </form>

      {aside && (
        <div className="lg:col-start-3 lg:row-start-1">{aside}</div>
      )}

      {/* The screen's one primary, pinned above the tab bar on phones and tablets. */}
      <PinnedCta until="lg" error={formError} className="lg:col-span-2">
        <Button
          type="submit"
          form={formId}
          size="lg"
          pending={saving || refreshing}
          pendingLabel={t("form.saving")}
          className="md:w-auto lg:h-11"
        >
          {isNew ? t("form.create") : t("form.save")}
        </Button>
      </PinnedCta>
    </div>
  );
}
