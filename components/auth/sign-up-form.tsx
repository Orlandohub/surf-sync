"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

type AccountType = "school_staff" | "instructor";

export function SignUpForm() {
  const t = useTranslations("SignUpPage");
  const [step, setStep] = useState<"type" | "form">("type");
  const [accountType, setAccountType] = useState<AccountType>("school_staff");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        type: accountType,
      });

      if (error) {
        // better-auth@1.6 returns USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (422)
        // for duplicate emails on the sign-up endpoint.
        if (
          error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          error.status === 422
        ) {
          setError(t("errors.emailTaken"));
        } else {
          setError(t("errors.generic"));
        }
        return;
      }

      setDone(true);
    } catch {
      // Network-level failure: better-fetch only converts HTTP errors into
      // { error }; transport errors reject the promise.
      setError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("success")}</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "type") {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              "school_staff",
              "instructor",
            ] as const
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setAccountType(type);
                setStep("form");
              }}
              className="group flex flex-col items-start gap-2 rounded-lg border border-border p-6 text-left transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="text-base font-medium">
                {t(`accountType.${type}.title`)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t(`accountType.${type}.description`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t(`accountType.${accountType}.title`)} —{" "}
          {t(`accountType.${accountType}.description`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("name.label")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name.placeholder")}
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("email.label")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email.placeholder")}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("password.label")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password.placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? t("submitting") : t("submit")}
          </Button>
          <button
            type="button"
            onClick={() => setStep("type")}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← {t("back")}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
