import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Compass } from "lucide-react";
import { getSession, toShellUser } from "@/lib/auth/session";
import { homeHrefFor } from "@/components/shell/nav-items";
import { PageContainer } from "@/components/shell/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("NotFoundPage");
  return { title: t("metaTitle") };
}

/**
 * Unmatched URLs and notFound() — inside the app shell, PT-PT. Leads back
 * to the person's own Início (or the landing page when signed out). A
 * narrow page like Conta and "Cria a tua escola": it starts under the
 * logo, at the top, as every page does.
 */
export default async function NotFound() {
  const [t, session] = await Promise.all([getTranslations("NotFoundPage"), getSession()]);
  const user = toShellUser(session);

  return (
    <PageContainer width="narrow">
      <EmptyState
        as="h1"
        icon={Compass}
        title={t("title")}
        description={t("description")}
        action={
          <Link href={user ? homeHrefFor(user.type) : "/"} className={buttonVariants()}>
            {t("backHome")}
            <ArrowRight aria-hidden strokeWidth={1.75} />
          </Link>
        }
      />
    </PageContainer>
  );
}
