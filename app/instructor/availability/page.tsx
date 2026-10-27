import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, UserRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInstructorOnboarding, getInstructorProfileData } from "@/lib/services/instructor";
import { PageContainer } from "@/components/shell/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { AvailabilityForm } from "@/components/instructor/availability-form";

export async function generateMetadata() {
  const t = await getTranslations("InstructorAvailabilityPage");
  return { title: t("title") };
}

export default async function InstructorAvailabilityPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.type !== "instructor") redirect("/");

  const [t, onboarding, data] = await Promise.all([
    getTranslations("InstructorAvailabilityPage"),
    getInstructorOnboarding(session.user.id),
    getInstructorProfileData(session.user.id),
  ]);

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />
      {onboarding.hasProfile ? (
        <AvailabilityForm
          // A status change (first save activates the profile) remounts the
          // form so the switch starts from the saved state.
          key={onboarding.profileStatus ?? "none"}
          status={onboarding.profileStatus}
          availability={data.availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      ) : (
        // Saving availability needs a profile first (service rule).
        <EmptyState
          className="lg:max-w-2xl"
          icon={UserRound}
          title={t("needsProfile.title")}
          description={t("needsProfile.description")}
          action={
            <Link href="/instructor/profile" className={buttonVariants()}>
              {t("needsProfile.action")}
              <ArrowRight aria-hidden strokeWidth={1.75} />
            </Link>
          }
        />
      )}
    </PageContainer>
  );
}
