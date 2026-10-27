import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, CircleUserRound, Eye, EyeOff } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInstructorProfileData } from "@/lib/services/instructor";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
  const status = profile?.profileStatus;
  const canToggle = status === "active" || status === "inactive";
  const paused = status === "inactive";

  return (
    <PageContainer>
      {/* The verified mark follows the name inside the h1, as on the
          school-facing profile: "Ana Marques, Identidade verificada". */}
      <PageHeader
        leading={
          <>
            <Avatar name={name} size={44} className="md:hidden" />
            <Avatar name={name} size={88} className="max-md:hidden" />
          </>
        }
        title={
          <>
            {name || t("title")}
            {verified && (
              <>
                <span className="sr-only">, {t("verified")}</span>
                <span aria-hidden className="ml-2 inline-flex align-middle">
                  <BadgeCheck className="size-5 text-primary" strokeWidth={1.75} />
                </span>
              </>
            )}
          </>
        }
        description={profile ? undefined : t("newProfile")}
      >
        {profile && (
          <>
            <Badge>{t(`levels.${profile.experienceLevel}`)}</Badge>
            <StatusBadge tone={STATUS_TONE[profile.profileStatus] ?? "neutral"}>
              {t(`status.${profile.profileStatus}`)}
            </StatusBadge>
          </>
        )}
      </PageHeader>

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
            {/* Pausing lives on Disponibilidade (the "Ativo" switch); this
                row says where, and the state, so it can be found from here. */}
            {canToggle && (
              <MenuRow
                icon={paused ? EyeOff : Eye}
                label={t("menu.visibility")}
                value={t(paused ? "menu.visibilityPaused" : "menu.visibilityActive")}
                href="/instructor/availability#visibilidade"
              />
            )}
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
