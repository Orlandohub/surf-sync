"use client";

import { useCallback, useEffect, useState } from "react";
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

type SessionRow = {
  id: string;
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Coarse device/browser label from a UA string (display only). */
function describeDevice(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Macintosh|Mac OS/i.test(ua)
      ? "Mac"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Safari\//i.test(ua)
        ? "Safari"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : "Browser";
  return `${os} · ${browser}`;
}

export function AccountSettings({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const t = useTranslations("AccountSettingsPage");
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Change-password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const reload = useCallback(async () => {
    const [list, cur] = await Promise.all([
      authClient.listSessions(),
      authClient.getSession(),
    ]);
    setSessions(list.data ?? []);
    setCurrentToken(cur.data?.session?.token ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [list, cur] = await Promise.all([
        authClient.listSessions(),
        authClient.getSession(),
      ]);
      if (cancelled) return;
      setSessions(list.data ?? []);
      setCurrentToken(cur.data?.session?.token ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRevokeOne(token: string) {
    setBusy(token);
    setError(null);
    const { error } = await authClient.revokeSession({ token });
    if (error) setError(t("errors.revokeFailed"));
    await reload();
    setBusy(null);
  }

  async function handleRevokeOthers() {
    setBusy("others");
    setError(null);
    const { error } = await authClient.revokeOtherSessions();
    if (error) setError(t("errors.revokeFailed"));
    await reload();
    setBusy(null);
  }

  async function handleSignOutEverywhere() {
    setBusy("all");
    setError(null);
    // signOut with no args revokes the current session; revokeSessions
    // (called first) clears every row for the user.
    const { error: revErr } = await authClient.revokeSessions();
    if (revErr) {
      setError(t("errors.revokeFailed"));
      setBusy(null);
      return;
    }
    await authClient.signOut();
    window.location.href = "/sign-in";
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);
    if (newPassword.length < 8) {
      setPwError(t("errors.passwordTooShort"));
      return;
    }
    setPwBusy(true);
    try {
      // revokeOtherSessions: PRD requires a password change to revoke
      // every other device. The current session stays signed in.
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        setPwError(t("errors.invalidPassword"));
        return;
      }
      setPwMessage(t("passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      await reload();
    } catch {
      setPwError(t("errors.generic"));
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {userName} · {userEmail}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("sessions.title")}</CardTitle>
          <CardDescription>{t("sessions.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sessions === null ? (
            <p className="text-sm text-muted-foreground">{t("sessions.loading")}</p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {sessions.map((s) => {
                  const isCurrent = s.token === currentToken;
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {describeDevice(s.userAgent)}
                          {isCurrent ? ` · ${t("sessions.current")}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleString("pt-PT")} ·{" "}
                          {t("sessions.expires")}{" "}
                          {new Date(s.expiresAt).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => handleRevokeOne(s.token)}
                        >
                          {busy === s.token ? t("sessions.revoking") : t("sessions.revoke")}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={handleRevokeOthers}
                >
                  {busy === "others" ? t("sessions.revoking") : t("sessions.revokeOthers")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy !== null}
                  onClick={handleSignOutEverywhere}
                >
                  {busy === "all" ? t("sessions.revoking") : t("sessions.signOutEverywhere")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">{t("password.current")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="next-password">{t("password.new")}</Label>
              <Input
                id="next-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {pwError && (
              <p className="text-sm text-destructive" role="alert">{pwError}</p>
            )}
            {pwMessage && (
              <p className="text-sm text-muted-foreground" role="status">{pwMessage}</p>
            )}
            <Button type="submit" disabled={pwBusy} className="self-start">
              {pwBusy ? t("password.submitting") : t("password.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
