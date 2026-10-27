import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, CircleUserRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInstructorProfileData } from "@/lib/services/instructor";
import { PageContainer } from "@/components/shell/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MenuGroup, MenuRow } from "@/components/ui/list-row";
import { StatusBadge, type StatusTone } from "@/components/brand/status-badge";
import { CalendarWave } from "@/components/brand/icons";
import { ProfileForm } from "@/components/instructor/profile-form";

export async function generateMetadata() {
  const t = await getTranslations("InstructorProfilePage");
  return { title: t("title") };
}

const STATUS_TONE: Record<string, StatusTone> = {
  active: "success",
  inactive: "warning",
  incomplete: "neutral",
  pending_review: "warning",
  suspended: "danger",
};

export default async function InstructorProfilePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const [t, data] = await Promise.all([
    getTranslations("InstructorProfilePage"),
    getInstructorProfileData(session.user.id),
  ]);

  const profile = data.profile;
  // First visit: the account name given at sign-up (no need to ask twice).
  const name = profile?.displayName ?? session.user.name ?? "";
  const verified = profile?.idVerificationStatus === "verified";
  const days = data.availability.length;

  return (
    <PageContainer>
      <header className="flex items-center gap-4 sm:gap-5">
        <Avatar name={name} size={88} />
        <div className="flex min-w-0 flex-col gap-2">
          {/* The h1 is the name only; the verified mark is announced next to it. */}
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-headline text-foreground">{name || t("title")}</h1>
            {verified && (
              <span className="flex shrink-0 items-center">
                <BadgeCheck aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
                <span className="sr-only">{t("verified")}</span>
              </span>
            )}
          </div>
          {profile ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge>{t(`levels.${profile.experienceLevel}`)}</Badge>
              <StatusBadge tone={STATUS_TONE[profile.profileStatus] ?? "neutral"}>
                {t(`status.${profile.profileStatus}`)}
              </StatusBadge>
            </div>
          ) : (
            <p className="text-body text-muted-foreground">{t("newProfile")}</p>
          )}
        </div>
      </header>

      <ProfileForm
        initial={{
          displayName: name,
          bio: profile?.bio ?? "",
          level: profile?.experienceLevel ?? null,
          locationIds: data.selectedLocationIds,
        }}
        locations={data.locations.map((l) => ({ id: l.id, name: l.name }))}
        hasAvailability={days > 0}
        isNew={!profile}
        aside={
          <MenuGroup label={t("menu.label")}>
            <MenuRow
              icon={CalendarWave}
              label={t("menu.availability")}
              value={t("menu.availabilityValue", { count: days })}
              href="/instructor/availability"
            />
            <MenuRow icon={CircleUserRound} label={t("menu.account")} href="/account" />
          </MenuGroup>
        }
      />
    </PageContainer>
  );
}
