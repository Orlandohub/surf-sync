"use client";

import { useState } from "react";
import Link from "next/link";
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

export function SignInForm() {
  const t = useTranslations("SignInPage");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Banner after a successful password reset redirect (?reset=success).
  // Read once on mount from location.search — avoids useSearchParams,
  // which would force a Suspense boundary on this page.
  const [resetSuccess] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("reset") === "success",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        // better-auth@1.6: UNAUTHORIZED + INVALID_EMAIL_OR_PASSWORD for bad
        // credentials. Message stays generic — never reveal which part was
        // wrong.
        setError(t("errors.invalidCredentials"));
        return;
      }

      // Signed in — instructors land on their dashboard, staff on home
      // (school surfaces arrive with Epic 5).
      window.location.href = "/";
    } catch {
      setError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {resetSuccess && (
            <p className="text-sm text-muted-foreground" role="status">
              {t("resetSuccess")}
            </p>
          )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password.label")}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
          <Link
            href="/sign-up"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("signUpInstead")}
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
