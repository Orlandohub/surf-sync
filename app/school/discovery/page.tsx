import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Bookmark, SearchX, UsersRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listLocations, searchInstructors, searchSchema } from "@/lib/services/discovery";
import {
  countSavedInstructors,
  findSchoolIdForUser,
  listVerifiedInstructorIds,
} from "@/lib/services/school-overview";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/link-tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { DiscoveryFilters } from "@/components/school/discovery-filters";
import { InstructorRow } from "@/components/school/instructor-row";
import { discoveryHref, hasFilters, type DiscoveryQuery } from "@/components/school/discovery-query";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("DiscoveryPage");
  return { title: t("title") };
}

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; experience?: string; day?: string; view?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "school_staff") redirect("/");
  // A brand-new school account creates its school first (on Início).
  if (!(await findSchoolIdForUser(session.user.id))) redirect("/school");

  const params = await searchParams;
  const parsed = searchSchema.safeParse({
    locationId: params.location,
    experience: params.experience,
    day: params.day,
  });
  const filters = parsed.success ? parsed.data : {};
  const query: DiscoveryQuery = {
    location: filters.locationId,
    experience: filters.experience,
    day: filters.day,
    view: params.view === "saved" ? "saved" : undefined,
  };

  const [found, locations, savedCount, t] = await Promise.all([
    searchInstructors(session.user.id, filters),
    listLocations(),
    countSavedInstructors(session.user.id),
    getTranslations("DiscoveryPage"),
  ]);
  const savedView = query.view === "saved";
  const results = savedView ? found.filter((i) => i.bookmarked) : found;
  const verified = new Set(await listVerifiedInstructorIds(results.map((r) => r.userId)));
  const filtered = hasFilters(query);
  const resetHref = discoveryHref({ view: query.view });
  // Nothing saved yet: no filters above an empty list, just the way back.
  const nothingSaved = savedView && savedCount === 0;

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-5">
        <LinkTabs
          label={t("views.label")}
          value={query.view ?? "all"}
          items={[
            { value: "all", href: discoveryHref({ ...query, view: undefined }), label: t("views.all") },
            {
              value: "saved",
              href: discoveryHref({ ...query, view: "saved" }),
              label: t("views.saved"),
              // The number is read with its noun: "Guardados, 1 instrutor".
              badge:
                savedCount > 0 ? (
                  <Badge variant="neutral" className="tabular-nums">
                    <span aria-hidden>{savedCount}</span>
                    <span className="sr-only">{t("views.savedCount", { count: savedCount })}</span>
                  </Badge>
                ) : undefined,
            },
          ]}
        />

        <DiscoveryFilters locations={locations} query={query} showFilters={!nothingSaved}>
          <div className={cn("flex min-h-11 items-center justify-between gap-4", results.length === 0 && "sr-only")}>
            {/* tabIndex: where focus goes when an unsaved row leaves Guardados. */}
            <h2
              id="resultados"
              tabIndex={-1}
              className="text-meta font-medium text-muted-foreground tabular-nums outline-none"
              aria-live="polite"
            >
              {t("resultsCount", { count: results.length })}
            </h2>
            {filtered && results.length > 0 && (
              <Link
                href={resetHref}
                scroll={false}
                className="tap rounded-chip text-meta font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("filters.reset")}
              </Link>
            )}
          </div>

          {results.length > 0 ? (
            <ul role="list" className="flex flex-col gap-stack">
              {results.map((instructor) => (
                <InstructorRow
                  key={instructor.userId}
                  instructor={instructor}
                  verified={verified.has(instructor.userId)}
                  focusAfterUnsave={savedView ? "resultados" : undefined}
                />
              ))}
            </ul>
          ) : nothingSaved ? (
            <EmptyState
              icon={Bookmark}
              title={t("emptySaved.title")}
              description={t("emptySaved.description")}
              action={
                // The screen's only action, so primary (COMPONENTS.md "Empty state").
                <Link href={discoveryHref({})} className={buttonVariants()}>
                  {t("emptySaved.action")}
                  <ArrowRight aria-hidden strokeWidth={1.75} />
                </Link>
              }
            />
          ) : !filtered ? (
            <EmptyState icon={UsersRound} title={t("emptyAll.title")} description={t("emptyAll.description")} />
          ) : (
            <EmptyState
              icon={SearchX}
              title={t("empty.title")}
              description={t("empty.description")}
              action={
                <Link href={resetHref} scroll={false} className={buttonVariants()}>
                  {t("filters.reset")}
                </Link>
              }
            />
          )}
        </DiscoveryFilters>
      </div>
    </PageContainer>
  );
}
