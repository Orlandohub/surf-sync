"use client";

import * as React from "react";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { AuthAltLink, AuthStateIcon } from "@/components/auth/auth-parts";
import { emailProblem } from "@/components/auth/auth-helpers";

export function ForgotPasswordForm() {
  const t = useTranslations("ForgotPasswordPage");
  const tv = useTranslations("Auth.validation");
  const ta = useTranslations("Auth");
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const problem = emailProblem(email);
    if (problem) {
      setEmailError(tv(problem));
      emailRef.current?.focus();
      return;
    }

    setPending(true);
    try {
      // Anti-enumeration: the endpoint always answers {status:true} with a
      // generic message, whether or not the address exists (and our email
      // limiter's errors are swallowed server-side). The UI must not imply
      // otherwise.
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (error) {
        setFormError(error.status === 429 ? ta("rateLimited") : t("errors.generic"));
        return;
      }
      setSentTo(email.trim());
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <AuthStateIcon icon={MailCheck} />
          <PageHeader
            title={t("done.title")}
            description={t.rich("done.description", {
              email: sentTo,
              strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
            })}
          />
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-meta text-muted-foreground">{t("done.spam")}</p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setSentTo(null);
              // Back to the form with the address ready to correct.
              requestAnimationFrame(() => emailRef.current?.focus());
            }}
          >
            {t("done.useAnotherEmail")}
          </Button>
        </div>
        <AuthAltLink href="/sign-in">{t("done.backToSignIn")}</AuthAltLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="email" label={t("email.label")} error={emailError}>
          <Input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("email.placeholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
          />
        </Field>

        {formError && <FieldError>{formError}</FieldError>}

        <Button type="submit" size="lg" className="mt-1" pending={pending} pendingLabel={t("submitting")}>
          {t("submit")}
        </Button>
      </form>

      <AuthAltLink lead={t("remembered")} href="/sign-in">
        {t("signIn")}
      </AuthAltLink>
    </div>
  );
}
