"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DAY_KEYS, weekdayName } from "@/lib/format";
import { discoveryHref, type DiscoveryQuery } from "@/components/school/discovery-query";

const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

/**
 * Zona · Nível · Dia as styled native selects. The URL is the source of
 * truth (shareable, works with back/forward); a change navigates at once
 * and the results below dim while the server answers.
 *
 * Laid out by the width the filters have (a size container, so larger
 * text counts): one row of three from 42rem (desktop), Zona full width
 * with Nível and Dia side by side from 20rem (phones), and one per row
 * below that (large text), so a value is never cut to its first letter.
 * `showFilters={false}` keeps only the results (Guardados with nothing
 * saved: there is nothing to filter).
 */
export function DiscoveryFilters({
  locations,
  query,
  showFilters = true,
  children,
}: {
  locations: { id: string; name: string }[];
  query: DiscoveryQuery;
  showFilters?: boolean;
  /** The results — dimmed while a filter change loads. */
  children: React.ReactNode;
}) {
  const t = useTranslations("DiscoveryPage");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [current, setCurrent] = React.useState(query);

  // Follow the URL (back/forward, "Limpar filtros", the view tabs).
  const [prev, setPrev] = React.useState(query);
  if (
    prev.location !== query.location ||
    prev.experience !== query.experience ||
    prev.day !== query.day ||
    prev.view !== query.view
  ) {
    setPrev(query);
    setCurrent(query);
  }

  function change(key: "location" | "experience" | "day", value: string) {
    const next = { ...current, [key]: value || undefined };
    setCurrent(next);
    startTransition(() => router.push(discoveryHref(next), { scroll: false }));
  }

  const selectClassName = "h-11";
  return (
    <>
      {showFilters && (
        <div className="@container">
          <form
            role="search"
            aria-label={t("filters.label")}
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 gap-3 @xs:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-4"
          >
            <Field label={t("filters.location")} className="@xs:col-span-2 @2xl:col-span-1">
              <Select
                name="location"
                value={current.location ?? ""}
                onChange={(e) => change("location", e.target.value)}
                selectClassName={selectClassName}
              >
                <option value="">{t("filters.anyLocation")}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("filters.level")}>
              <Select
                name="experience"
                value={current.experience ?? ""}
                onChange={(e) => change("experience", e.target.value)}
                selectClassName={selectClassName}
              >
                <option value="">{t("filters.anyLevel")}</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`levels.${level}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("filters.day")}>
              <Select
                name="day"
                value={current.day ?? ""}
                onChange={(e) => change("day", e.target.value)}
                selectClassName={selectClassName}
              >
                <option value="">{t("filters.anyDay")}</option>
                {DAY_KEYS.map((d) => (
                  <option key={d} value={d}>
                    {weekdayName(d)}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        </div>
      )}
      <div
        aria-busy={pending || undefined}
        className={cn(
          "flex flex-col gap-3 transition-opacity duration-(--duration-fast) ease-move",
          pending && "opacity-60",
        )}
      >
        {children}
      </div>
    </>
  );
}
