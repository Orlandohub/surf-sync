"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleBookmarkAction } from "@/lib/actions/discovery";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { InstructorCard } from "@/lib/services/discovery";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

export function DiscoverySearch({
  results,
  locations,
}: {
  results: InstructorCard[];
  locations: { id: string; name: string; region: string }[];
}) {
  const t = useTranslations("DiscoveryPage");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [locationId, setLocationId] = useState("");
  const [experience, setExperience] = useState("");
  const [day, setDay] = useState("");
  const [pending, startNavigation] = useTransition();

  function applyFilters(next: { location?: string; experience?: string; day?: string }) {
    const params = new URLSearchParams();
    const loc = next.location ?? locationId;
    const exp = next.experience ?? experience;
    const d = next.day ?? day;
    if (loc) params.set("location", loc);
    if (exp) params.set("experience", exp);
    if (d) params.set("day", d);
    startNavigation(() => router.push(`/school/discovery?${params.toString()}`));
  }

  async function handleBookmark(instructorId: string) {
    await toggleBookmarkAction(instructorId);
    startTransition(() => router.refresh());
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-3xl flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="w-full max-w-3xl">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="filter-location">{t("filters.location")}</label>
            <select
              id="filter-location"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                applyFilters({ location: e.target.value });
              }}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">{t("filters.anyLocation")}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="filter-experience">{t("filters.experience")}</label>
            <select
              id="filter-experience"
              value={experience}
              onChange={(e) => {
                setExperience(e.target.value);
                applyFilters({ experience: e.target.value });
              }}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">{t("filters.anyExperience")}</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{t(`experience.${lvl}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="filter-day">{t("filters.day")}</label>
            <select
              id="filter-day"
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                applyFilters({ day: e.target.value });
              }}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">{t("filters.anyDay")}</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{t(`days.${d}`)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <p className="w-full max-w-3xl text-sm text-muted-foreground">
        {t("resultsCount", { count: results.length })}
      </p>

      <div className="flex w-full max-w-3xl flex-col gap-4">
        {results.map((instructor) => (
          <Card key={instructor.userId}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">
                  <Link href={`/school/discovery/${instructor.userId}`} className="hover:underline">
                    {instructor.displayName}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {t(`experience.${instructor.experienceLevel}`)}
                  {instructor.locations.length > 0 && ` · ${instructor.locations.join(", ")}`}
                </CardDescription>
              </div>
              <Button
                variant={instructor.bookmarked ? "default" : "outline"}
                size="sm"
                disabled={pending}
                onClick={() => handleBookmark(instructor.userId)}
                aria-pressed={instructor.bookmarked}
              >
                {instructor.bookmarked ? "★" : "☆"} {t("bookmark")}
              </Button>
            </CardHeader>
            {instructor.bio && (
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{instructor.bio}</p>
              </CardContent>
            )}
          </Card>
        ))}
        {results.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
