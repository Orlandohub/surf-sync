import { useTranslations } from "next-intl";
import { Clock3, Mail } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RowIcon } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/brand/status-badge";
import { InviteStaffForm } from "@/components/school/invite-staff-form";
import { formatDate, lisbonDate } from "@/lib/format";
import type { SchoolDashboardData } from "@/lib/services/school";
import { cn } from "@/lib/utils";

const divider =
  "relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-rule-avatar not-first:before:h-px not-first:before:bg-border";

/**
 * Equipa on Início: members (avatar, name, email, "Desde 27 de outubro"),
 * pending invitations, and the invite-by-email field — one card, inset
 * dividers, the form under a full-width divider. Names and emails wrap
 * (an email anywhere, it has no spaces) instead of being cut short.
 */
export function TeamSection({
  staff,
  pendingInvites,
  currentUserId,
  className,
}: {
  staff: SchoolDashboardData["staff"];
  pendingInvites: SchoolDashboardData["pendingInvites"];
  currentUserId: string;
  className?: string;
}) {
  const t = useTranslations("SchoolDashboardPage.team");
  return (
    <section aria-labelledby="equipa" className={cn("flex flex-col gap-3", className)}>
      <SectionHeading id="equipa" title={t("title")} description={t("description")} />
      <div className="overflow-hidden rounded-card border bg-card shadow-card">
        <ul role="list" aria-label={t("members")}>
          {staff.map((m) => (
            <li key={m.userId} className={cn("flex flex-wrap items-center gap-3 px-card py-3", divider)}>
              <Avatar name={m.name} />
              {/* Drops under the avatar when it can't have 11rem beside it. */}
              <div className="flex min-w-0 grow basis-44 flex-col">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 text-label break-words text-foreground">{m.name}</span>
                  {m.userId === currentUserId && <Badge variant="neutral">{t("you")}</Badge>}
                </span>
                <span className="text-meta break-words text-muted-foreground">{m.email}</span>
                <span className="text-meta text-muted-foreground tabular-nums">
                  {t("joined", { date: formatDate(lisbonDate(m.joinedAt)) })}
                </span>
              </div>
            </li>
          ))}
          {pendingInvites.map((inv) => (
            <li key={inv.email} className={cn("flex flex-wrap items-center gap-3 px-card py-3", divider)}>
              <RowIcon icon={Mail} />
              <div className="flex min-w-0 grow basis-44 flex-col">
                <span className="text-label break-words text-foreground">{inv.email}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusBadge tone="warning" icon={Clock3}>
                    {t("pendingBadge")}
                  </StatusBadge>
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {t("expires", { date: formatDate(lisbonDate(inv.expiresAt)) })}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border p-card">
          <InviteStaffForm />
        </div>
      </div>
    </section>
  );
}
