"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordInput } from "@/components/auth/password-input";
import { ResetLinkInvalid } from "@/components/auth/reset-link-invalid";
import { newPasswordProblem, resetPasswordErrorKey } from "@/components/auth/auth-helpers";

type Errors = { password?: string; confirm?: string; form?: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("ResetPasswordPage");
  const tv = useTranslations("Auth.validation");
  const ta = useTranslations("Auth");
  const tp = useTranslations("Auth.password");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = newPasswordProblem(password);
    const next: Errors = {
      password: problem ? tv(problem) : undefined,
      confirm: !problem && password !== confirm ? t("errors.passwordMismatch") : undefined,
    };
    if (next.password || next.confirm) {
      setErrors(next);
      (next.password ? passwordRef : confirmRef).current?.focus();
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) {
        const key = resetPasswordErrorKey(error);
        // The token is single-use and server-stored: once rejected, the
        // form is useless — show the "request a new link" state.
        if (key === "invalidToken") setExpired(true);
        else if (key === "passwordTooShort") setErrors({ password: tv("passwordTooShort") });
        else setErrors({ form: key === "rateLimited" ? ta("rateLimited") : t("errors.generic") });
        setPending(false);
        return;
      }
      // Success → every session is revoked server-side
      // (revokeSessionsOnPasswordReset); sign in with the new password.
      window.location.href = "/sign-in?reset=success";
    } catch {
      setErrors({ form: t("errors.generic") });
      setPending(false);
    }
  }

  if (expired) return <ResetLinkInvalid />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="new-password" label={t("newPassword.label")} helper={tp("requirements")} error={errors.password}>
          <PasswordInput
            ref={passwordRef}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((s) => ({ ...s, password: undefined }));
            }}
          />
        </Field>

        <Field id="confirm-password" label={t("confirmPassword.label")} error={errors.confirm}>
          <PasswordInput
            ref={confirmRef}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((s) => ({ ...s, confirm: undefined }));
            }}
          />
        </Field>

        {errors.form && <FieldError>{errors.form}</FieldError>}

        <Button type="submit" size="lg" className="mt-1" pending={pending} pendingLabel={t("submitting")}>
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
