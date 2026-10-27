import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/shell/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton of the instructor profile: header, availability card, form card. */
export default function InstructorProfileLoading() {
  const t = useTranslations("DiscoveryPage.profile");
  return (
    <PageContainer aria-busy>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-4 md:gap-5">
          <Skeleton className="size-11 shrink-0 rounded-full md:size-22" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-section lg:grid lg:grid-cols-5 lg:items-start lg:gap-x-8">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <Skeleton className="h-5 w-48" />
          <div aria-hidden className="flex flex-col rounded-card border bg-card shadow-card">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex h-12 items-center justify-between px-card">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden className="flex h-96 flex-col gap-4 rounded-card border bg-card p-card shadow-card lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full rounded-control" />
          <Skeleton className="h-12 w-full rounded-control" />
          <Skeleton className="h-24 w-full rounded-control" />
        </div>
      </div>
    </PageContainer>
  );
}
