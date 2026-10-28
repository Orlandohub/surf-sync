"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthAltLink, AuthNotice, authStandaloneLinkClass } from "@/components/auth/auth-parts";
import { emailProblem, homeFor, signInErrorKey } from "@/components/auth/auth-helpers";

type Errors = { email?: string; password?: string; form?: string };

export function SignInForm({
  resetSuccess = false,
  next: nextPath = null,
}: {
  resetSuccess?: boolean;
  /** A checked same-site path to open after signing in (safeNextPath). */
  next?: string | null;
}) {
  const t = useTranslations("SignInPage");
  const tv = useTranslations("Auth.validation");
  const ta = useTranslations("Auth");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = emailProblem(email);
    const next: Errors = {
      email: problem ? tv(problem) : undefined,
      password: password ? undefined : tv("passwordRequired"),
    };
    if (next.email || next.password) {
      setErrors(next);
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) {
        // Generic on purpose — never reveal which part was wrong.
        const key = signInErrorKey(error);
        setErrors({ form: key === "rateLimited" ? ta("rateLimited") : t(`errors.${key}`) });
        setPending(false);
        return;
      }
      // Back to where the person was sent from (`next`), else their own
      // dashboard by account type. Full navigation so the server-rendered
      // shell picks up the session.
      if (nextPath) {
        window.location.href = nextPath;
        return;
      }
      const { data: session } = await authClient.getSession();
      window.location.href = homeFor(session?.user?.type);
    } catch (err) {
      console.error(err);
      setErrors({ form: t("errors.generic") });
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {resetSuccess && <AuthNotice>{t("resetSuccess")}</AuthNotice>}

        <Field id="email" label={t("email.label")} error={errors.email}>
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
              if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
            }}
          />
        </Field>

        {/* 14px: clears the link's 44px touch area (13px above its line). */}
        <div className="flex flex-col gap-3.5">
          <Field id="password" label={t("password.label")} error={errors.password}>
            <PasswordInput
              ref={passwordRef}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((s) => ({ ...s, password: undefined }));
              }}
            />
          </Field>
          <Link href="/forgot-password" className={`${authStandaloneLinkClass} self-start text-meta`}>
            {t("forgotPassword")}
          </Link>
        </div>

        {errors.form && <FieldError>{errors.form}</FieldError>}

        <Button type="submit" size="lg" className="mt-1" pending={pending} pendingLabel={t("submitting")}>
          {t("submit")}
          <ArrowRight aria-hidden strokeWidth={1.75} />
        </Button>
      </form>

      <AuthAltLink lead={t("noAccount")} href="/sign-up">
        {t("signUp")}
      </AuthAltLink>
    </div>
  );
}
