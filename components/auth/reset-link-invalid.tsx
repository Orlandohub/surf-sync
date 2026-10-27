import Link from "next/link";
import { Link2Off } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AuthAltLink, AuthStateIcon } from "@/components/auth/auth-parts";

/**
 * "Este link já não é válido" for /reset-password: shown by the page when
 * the link arrives without a token (or with ?error=INVALID_TOKEN), and by
 * the form when the server rejects the token on submit. Hook-only
 * (useTranslations), so it renders from Server and Client Components.
 */
export function ResetLinkInvalid() {
  const t = useTranslations("ResetPasswordPage.invalid");
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <AuthStateIcon icon={Link2Off} tone="warning" />
        <PageHeader title={t("title")} description={t("description")} />
      </div>
      <Link href="/forgot-password" className={buttonVariants({ size: "lg" })}>
        {t("requestNew")}
      </Link>
      <AuthAltLink href="/sign-in">{t("backToSignIn")}</AuthAltLink>
    </div>
  );
}
