import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, MailCheck, MailX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthAltLink, AuthStateIcon } from "@/components/auth/auth-parts";
import { AuthStateScreen } from "@/components/auth/auth-state";
import { ResendVerification } from "@/components/auth/resend-verification";
import { resendStartFor } from "@/components/auth/resend-start";
import { homeFor } from "@/components/auth/auth-helpers";

export async function generateMetadata() {
  const t = await getTranslations("VerifyEmailPage");
  return { title: t("metaTitle") };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const t = await getTranslations("VerifyEmailPage");
  const params = await searchParams;

  // Better Auth redirects to the BARE callbackURL on success (token stripped)
  // and appends `?error=CODE` on failure — so ANY error param means failure
  // and no error param means success. Codes are all-caps in 1.6
  // (INVALID_TOKEN, TOKEN_EXPIRED, ...); match any of them.
  const failed = Boolean(params.error);

  const session = await getSession();
  const verified = session?.user.emailVerified ?? false;
  const destination = session ? homeFor(session.user.type) : "/sign-in";
  const continueLink = (
    <Link href={destination} className={buttonVariants({ size: "lg" })}>
      {t("continue")}
      <ArrowRight aria-hidden strokeWidth={1.75} />
    </Link>
  );
  const strong = (chunks: ReactNode) => <strong className="font-semibold text-foreground">{chunks}</strong>;

  // A signed-in person whose email isn't confirmed, on a bare visit (from
  // a bookmark or the app, not from a link): nothing was confirmed, so
  // say what's pending and offer a new email.
  if (!failed && session && !verified) {
    return (
      <AuthLayout>
        <AuthStateScreen>
          <div className="flex flex-col gap-5">
            <AuthStateIcon icon={MailCheck} />
            <PageHeader
              title={t("pending.title")}
              description={t.rich("pending.description", { email: session.user.email, strong })}
            />
          </div>
          <ResendVerification
            email={session.user.email}
            start={await resendStartFor(session.user.email)}
            variant="default"
          />
          <AuthAltLink href={destination}>{t("back")}</AuthAltLink>
        </AuthStateScreen>
      </AuthLayout>
    );
  }

  // Success. Signed out (the link was opened in another browser): the
  // address is confirmed, sign in to continue. Anyone else lands here
  // only from Better Auth's success redirect.
  if (!failed) {
    return (
      <AuthLayout>
        <AuthStateScreen>
          <div className="flex flex-col gap-5">
            <AuthStateIcon icon={MailCheck} tone="success" />
            <PageHeader
              title={t("title")}
              description={session ? t("description.signedIn") : t("description.signedOut")}
            />
          </div>
          {continueLink}
        </AuthStateScreen>
      </AuthLayout>
    );
  }

  // Failure. Signed in: resend from here (or, if the address got
  // confirmed meanwhile, just continue). Signed out: sign in first —
  // an anonymous resend-by-address would reveal which accounts exist.
  return (
    <AuthLayout>
      <AuthStateScreen>
        <div className="flex flex-col gap-5">
          <AuthStateIcon icon={MailX} tone="warning" />
          <PageHeader title={t("failedTitle")} description={t("failedDescription")} />
        </div>

        {!session ? (
          <div className="flex flex-col gap-4">
            <p className="text-body text-muted-foreground">{t("failed.signInHint")}</p>
            <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
              {t("failed.signIn")}
              <ArrowRight aria-hidden strokeWidth={1.75} />
            </Link>
          </div>
        ) : verified ? (
          <div className="flex flex-col gap-4">
            <p className="text-body text-muted-foreground">{t("failed.alreadyVerified")}</p>
            {continueLink}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-body text-muted-foreground">
              {t.rich("failed.resendHint", { email: session.user.email, strong })}
            </p>
            <ResendVerification
              email={session.user.email}
              start={await resendStartFor(session.user.email)}
              variant="default"
            />
            <AuthAltLink href={destination}>{t("back")}</AuthAltLink>
          </div>
        )}
      </AuthStateScreen>
    </AuthLayout>
  );
}
