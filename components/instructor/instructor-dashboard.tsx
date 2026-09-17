"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveProfileAction,
  saveAvailabilityAction,
  setPausedAction,
} from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { InstructorOnboarding } from "@/lib/services/instructor";

type ProfileData = {
  profile: {
    displayName: string;
    bio: string | null;
    experienceLevel: "beginner" | "intermediate" | "advanced" | "expert";
    profileStatus: string;
  } | null;
  selectedLocationIds: string[];
  locations: { id: string; name: string; region: string }[];
  availability: { dayOfWeek: string; startTime: string; endTime: string }[];
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function InstructorDashboard({
  onboarding,
  data,
  fallbackName,
}: {
  onboarding: InstructorOnboarding;
  data: ProfileData;
  fallbackName?: string;
}) {
  const t = useTranslations("InstructorDashboardPage");
  const router = useRouter();

  // Prefill from the saved profile; first visit falls back to the
  // account name given at signup (asking for it twice would be silly).
  const [displayName, setDisplayName] = useState(
    data.profile?.displayName ?? fallbackName ?? "",
  );
  const [bio, setBio] = useState(data.profile?.bio ?? "");
  const [experience, setExperience] = useState(data.profile?.experienceLevel ?? "beginner");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(data.selectedLocationIds);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [slots, setSlots] = useState<Record<string, { on: boolean; start: string; end: string }>>(() => {
    const initial: Record<string, { on: boolean; start: string; end: string }> = {};
    for (const d of DAYS) {
      const existing = data.availability.find((a) => a.dayOfWeek === d);
      initial[d] = existing
        ? { on: true, start: existing.startTime, end: existing.endTime }
        : { on: false, start: "09:00", end: "17:00" };
    }
    return initial;
  });
  const [availMsg, setAvailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingAvail, setSavingAvail] = useState(false);
  const [pausing, setPausing] = useState(false);

  const status = onboarding.profileStatus;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    const res = await saveProfileAction({
      displayName,
      bio,
      experienceLevel: experience,
      locationIds: selectedLocations,
    });
    setSavingProfile(false);
    if (res.ok) {
      setProfileMsg({ ok: true, text: t("profile.saved") });
      router.refresh();
    } else {
      setProfileMsg({ ok: false, text: res.error });
    }
  }

  async function handleSaveAvailability(e: React.FormEvent) {
    e.preventDefault();
    setAvailMsg(null);
    setSavingAvail(true);
    const payload = DAYS.filter((d) => slots[d].on).map((d) => ({
      dayOfWeek: d,
      startTime: slots[d].start,
      endTime: slots[d].end,
    }));
    const res = await saveAvailabilityAction({ slots: payload });
    setSavingAvail(false);
    if (res.ok) {
      setAvailMsg({ ok: true, text: t("availability.saved") });
      router.refresh();
    } else {
      setAvailMsg({ ok: false, text: res.error });
    }
  }

  async function handlePause(paused: boolean) {
    setPausing(true);
    const res = await setPausedAction(paused);
    setPausing(false);
    if (res.ok) router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-1">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {status === "active" && t("status.active")}
          {status === "inactive" && t("status.inactive")}
          {(status === "incomplete" || status === null) && t("status.incomplete")}
        </p>
        <Link href="/instructor/bookings" className="text-sm text-muted-foreground underline underline-offset-4">
          {t("viewBookings")} →
        </Link>
      </div>

      {/* Onboarding steps */}
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {onboarding.steps.map((step, i) => (
          <div
            key={step.key}
            className={`rounded-lg border p-4 ${step.done ? "border-primary/40 bg-primary/5" : "border-border"}`}
          >
            <span className="text-xs text-muted-foreground">
              {t(`steps.${i + 1}`)}
            </span>
            <p className="mt-1 text-sm font-medium">
              {t(`stepLabels.${step.key}`)} {step.done ? "✓" : "•"}
            </p>
          </div>
        ))}
      </div>

      {/* Profile form */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">{t("profile.displayName")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                value={bio ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("profile.experience")}</Label>
              <div className="flex flex-wrap gap-2">
                {(["beginner", "intermediate", "advanced", "expert"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperience(lvl)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      experience === lvl
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {t(`experience.${lvl}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("profile.locations")}</Label>
              <div className="flex flex-wrap gap-2">
                {data.locations.map((loc) => {
                  const on = selectedLocations.includes(loc.id);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() =>
                        setSelectedLocations((prev) =>
                          on ? prev.filter((id) => id !== loc.id) : [...prev, loc.id],
                        )
                      }
                      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
                {profileMsg.text}
              </p>
            )}
            <Button type="submit" disabled={savingProfile} className="self-start">
              {savingProfile ? t("profile.saving") : t("profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Availability form */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("availability.title")}</CardTitle>
          <CardDescription>{t("availability.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAvailability} className="flex flex-col gap-3">
            {DAYS.map((d) => (
              <div key={d} className="flex items-center gap-3">
                <label className="flex w-28 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={slots[d].on}
                    onChange={(e) =>
                      setSlots((prev) => ({ ...prev, [d]: { ...prev[d], on: e.target.checked } }))
                    }
                  />
                  {t(`days.${d}`)}
                </label>
                <Input
                  type="time"
                  value={slots[d].start}
                  disabled={!slots[d].on}
                  onChange={(e) =>
                    setSlots((prev) => ({ ...prev, [d]: { ...prev[d], start: e.target.value } }))
                  }
                  className="w-32"
                  aria-label={t(`days.${d}`) + " start"}
                />
                <span className="text-sm text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={slots[d].end}
                  disabled={!slots[d].on}
                  onChange={(e) =>
                    setSlots((prev) => ({ ...prev, [d]: { ...prev[d], end: e.target.value } }))
                  }
                  className="w-32"
                  aria-label={t(`days.${d}`) + " end"}
                />
              </div>
            ))}
            {availMsg && (
              <p className={`text-sm ${availMsg.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
                {availMsg.text}
              </p>
            )}
            <Button type="submit" disabled={savingAvail} className="self-start">
              {savingAvail ? t("availability.saving") : t("availability.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pause / reactivate */}
      {status && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t("pause.title")}</CardTitle>
            <CardDescription>{t("pause.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "active" ? (
              <Button variant="outline" disabled={pausing} onClick={() => handlePause(true)}>
                {t("pause.pause")}
              </Button>
            ) : status === "inactive" ? (
              <Button disabled={pausing} onClick={() => handlePause(false)}>
                {t("pause.reactivate")}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("pause.notAvailable")}</p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
