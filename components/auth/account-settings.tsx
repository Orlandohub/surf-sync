"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  IdCard,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  MailCheck,
  Monitor,
  MonitorOff,
  MonitorSmartphone,
  MonitorX,
  Smartphone,
  Tablet,
  UserRound,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { daysFromToday, formatDate, formatTime, lisbonDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { MenuGroup, MenuRow } from "@/components/ui/list-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import type { IconComponent } from "@/components/brand/icons";
import { PasswordInput } from "@/components/auth/password-input";
import {
  ResendStatus,
  useResendVerification,
  type ResendStart,
} from "@/components/auth/resend-verification";
import {
  changePasswordErrorKey,
  describeDevice,
  lisbonTimeOf,
  newPasswordProblem,
  type AccountType,
  type DeviceKind,
} from "@/components/auth/auth-helpers";

type SessionRow = {
  id: string;
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const DEVICE_ICON: Record<DeviceKind, IconComponent> = {
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: MonitorSmartphone,
};

/**
 * A row's leading icon while its action runs (MenuRow has no pending
 * state, and its `value` slot only takes text).
 */
const PendingIcon: IconComponent = ({ className, ...props }) => (
  <LoaderCircle {...props} className={cn(className, "animate-spin")} />
);

/** "27 de outubro" from a timestamp (Lisbon calendar day). */
function dayOf(at: Date | string): string {
  return formatDate(lisbonDate(at));
}

/**
 * /account — account data, password, active sessions, sign out
 * (COMPONENTS.md "Menu row"). Operational screen: Inter only.
 *
 * Sessions are listed client-side (Better Auth's listSessions); the
 * current one is marked and listed first. A password change revokes every
 * other session (revokeOtherSessions) and rotates the current one, so the
 * list and the current id are re-read after it.
 */
export function AccountSettings({
  userName,
  userEmail,
  userType,
  emailVerified,
  resendStart,
}: {
  userName: string;
  userEmail: string;
  userType: AccountType;
  emailVerified: boolean;
  /** Server-read email budget (unconfirmed email only), see ResendStart. */
  resendStart?: ResendStart;
}) {
  const t = useTranslations("AccountSettingsPage");
  const [sessions, setSessions] = React.useState<SessionRow[] | null>(null);
  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);
  // Kind outlives `open` so the dialog's text doesn't flip while it closes.
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] = React.useState<"others" | "all">("others");
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [signOutError, setSignOutError] = React.useState<string | null>(null);
  const resend = useResendVerification(userEmail, resendStart);
  const sessionsListRef = React.useRef<HTMLUListElement>(null);

  /**
   * Revoking removes the row that held focus (the row's "Terminar", or the
   * "Terminar outras sessões" row once none remain), which would drop
   * focus to <body>. Land it on the sessions list instead — after `delay`
   * when a dialog is closing and returns focus first.
   */
  function keepFocusInSessions(delay = 0) {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body || !active.isConnected) sessionsListRef.current?.focus();
    }, delay);
  }

  const load = React.useCallback(async () => {
    const [list, current] = await Promise.all([authClient.listSessions(), authClient.getSession()]);
    if (list.error) throw list.error;
    return { list: list.data ?? [], currentId: current.data?.session?.id ?? null };
  }, []);

  /** First load, and "Tentar novamente" after it failed. */
  const fetchSessions = React.useCallback(
    (isCancelled: () => boolean = () => false) =>
      load().then(
        (next) => {
          if (isCancelled()) return;
          setSessions(next.list);
          setCurrentId(next.currentId);
          setLoadFailed(false);
        },
        (err: unknown) => {
          if (isCancelled()) return;
          console.error(err);
          setLoadFailed(true);
        },
      ),
    [load],
  );

  /** Re-read after an action; a failure keeps the list and says so. */
  async function reload() {
    try {
      const next = await load();
      setSessions(next.list);
      setCurrentId(next.currentId);
    } catch (err) {
      console.error(err);
      setSessionsError(t("sessions.loadFailed"));
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    void fetchSessions(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchSessions]);

  const ordered = React.useMemo(() => {
    if (!sessions) return null;
    const time = (s: SessionRow) => new Date(s.createdAt).getTime();
    return [...sessions].sort((a, b) => {
      if (a.id === currentId) return -1;
      if (b.id === currentId) return 1;
      return time(b) - time(a);
    });
  }, [sessions, currentId]);
  const hasOthers = !!ordered && ordered.some((s) => s.id !== currentId);

  function deviceName(ua: string | null | undefined): string {
    const d = describeDevice(ua);
    if (!d.os && !d.browser) return t("sessions.unknownDevice");
    return [d.os, d.browser ?? t("sessions.unknownBrowser")].filter(Boolean).join(" · ");
  }

  /** "hoje às 14:30", "ontem à 1:05", "a 25 de outubro às 9:10" (Lisbon). */
  function startedWhen(at: Date | string): string {
    const date = lisbonDate(at);
    const time = lisbonTimeOf(at);
    const diff = daysFromToday(date);
    return t("sessions.startedAt", {
      day: diff === 0 ? "today" : diff === -1 ? "yesterday" : "other",
      date: formatDate(date),
      time: formatTime(time),
      hour: Number(time.slice(0, 2)),
    });
  }

  async function revokeOne(session: SessionRow) {
    setBusy(session.id);
    setSessionsError(null);
    try {
      const { error } = await authClient.revokeSession({ token: session.token });
      if (error) setSessionsError(t("errors.revokeFailed"));
      else toast(t("sessions.revoked"));
      await reload();
    } catch (err) {
      console.error(err);
      setSessionsError(t("errors.revokeFailed"));
    } finally {
      setBusy(null);
      keepFocusInSessions();
    }
  }

  async function revokeOthers() {
    const { error } = await authClient.revokeOtherSessions();
    if (error) {
      setConfirmError(t("errors.revokeFailed"));
      return false;
    }
    toast(t("sessions.othersRevoked"));
    await reload();
    // The dialog's exit (duration-base) ends by returning focus to a row
    // that no longer exists.
    keepFocusInSessions(400);
  }

  async function signOutEverywhere() {
    // revokeSessions clears every row for the user; signOut then drops
    // this browser's cookie.
    const { error } = await authClient.revokeSessions();
    if (error) {
      setConfirmError(t("errors.revokeFailed"));
      return false;
    }
    await authClient.signOut();
    window.location.href = "/sign-in";
    // Stay pending until the navigation replaces the page.
    await new Promise<never>(() => {});
  }

  function openConfirm(kind: "others" | "all") {
    setConfirmKind(kind);
    setConfirmError(null);
    setConfirmOpen(true);
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
      // Full navigation so the server-rendered shell drops the session.
      window.location.assign("/");
    } catch (err) {
      console.error(err);
      setSignOutError(t("errors.signOutFailed"));
      setSigningOut(false);
    }
  }

  return (
    <>
      <section aria-labelledby="account-data" className="flex flex-col gap-3">
        <SectionHeading id="account-data" title={t("account.heading")} />
        <MenuGroup>
          <MenuRow icon={UserRound} label={<Stacked label={t("account.name")} value={userName} />} />
          <MenuRow
            icon={Mail}
            label={
              <Stacked
                label={t("account.email")}
                value={userEmail}
                badge={emailVerified ? null : <Badge variant="warning">{t("account.unverified")}</Badge>}
              />
            }
          />
          <MenuRow
            icon={IdCard}
            label={<Stacked label={t("account.type")} value={t(`account.types.${userType}`)} />}
          />
        </MenuGroup>
        {!emailVerified && (
          <>
            {/* An action, so its own group rather than a fourth data row.
                It stays focusable while it waits (aria-disabled): a native
                disabled button would drop keyboard focus to the page. */}
            <MenuGroup>
              <MenuRow
                icon={resend.pending ? PendingIcon : MailCheck}
                label={t("account.resend")}
                onClick={() => void resend.send()}
                aria-disabled={resend.blocked || undefined}
                aria-busy={resend.pending || undefined}
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
              />
            </MenuGroup>
            <ResendStatus state={resend} />
          </>
        )}
      </section>

      <section aria-labelledby="account-security" className="flex flex-col gap-3">
        <SectionHeading id="account-security" title={t("security.heading")} />
        <MenuGroup>
          <MenuRow
            icon={KeyRound}
            label={t("security.changePassword")}
            onClick={() => setPasswordOpen(true)}
            aria-haspopup="dialog"
          />
        </MenuGroup>
      </section>

      <section aria-labelledby="account-sessions" className="flex flex-col gap-3">
        <SectionHeading
          id="account-sessions"
          title={t("sessions.heading")}
          description={t("sessions.description")}
        />
        <ul
          ref={sessionsListRef}
          role="list"
          tabIndex={-1}
          aria-labelledby="account-sessions"
          aria-busy={(ordered === null && !loadFailed) || undefined}
          className="overflow-hidden rounded-card border bg-card shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {ordered === null && loadFailed ? (
            <li className="flex flex-col items-start gap-3 px-card py-4">
              <p className="text-meta text-muted-foreground">{t("sessions.loadFailed")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadFailed(false);
                  // The button goes with the error state: keep focus here.
                  keepFocusInSessions();
                  void fetchSessions();
                }}
              >
                {t("sessions.retry")}
              </Button>
            </li>
          ) : ordered === null ? (
            <>
              {/* A list owns only listitems: the live region sits inside one. */}
              <li className="sr-only">
                <span role="status">{t("sessions.loading")}</span>
              </li>
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          ) : (
            ordered.map((s) => {
              const current = s.id === currentId;
              const device = deviceName(s.userAgent);
              const Icon = DEVICE_ICON[describeDevice(s.userAgent).kind];
              const when = startedWhen(s.createdAt);
              return (
                <SessionItem
                  key={s.id}
                  icon={Icon}
                  title={device}
                  badge={current ? <Badge>{t("sessions.current")}</Badge> : null}
                  meta={[t("sessions.started", { when }), t("sessions.expires", { date: dayOf(s.expiresAt) })]}
                  action={
                    current ? null : (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={t("sessions.revokeLabel", { device, when })}
                        disabled={busy !== null && busy !== s.id}
                        // Spinner only: a gerund label would widen the
                        // button and squeeze the meta line on phones.
                        pending={busy === s.id}
                        onClick={() => revokeOne(s)}
                      >
                        {t("sessions.revoke")}
                      </Button>
                    )
                  }
                />
              );
            })
          )}
        </ul>
        {sessionsError && <FieldError>{sessionsError}</FieldError>}
        {/* Only with other sessions: otherwise "todas" is just "Terminar
            sessão" again. The dialogs carry the destructive tone. */}
        {hasOthers && (
          <MenuGroup label={t("sessions.actionsLabel")}>
            <MenuRow
              icon={MonitorX}
              label={t("sessions.revokeOthers")}
              onClick={() => openConfirm("others")}
              disabled={busy !== null}
              aria-haspopup="dialog"
            />
            <MenuRow
              icon={MonitorOff}
              label={t("sessions.signOutEverywhere")}
              onClick={() => openConfirm("all")}
              disabled={busy !== null}
              aria-haspopup="dialog"
            />
          </MenuGroup>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <MenuGroup>
          <MenuRow
            icon={signingOut ? PendingIcon : LogOut}
            label={t("signOut")}
            destructive
            onClick={() => void signOut()}
            aria-busy={signingOut || undefined}
          />
        </MenuGroup>
        {signOutError && <FieldError>{signOutError}</FieldError>}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        tone="destructive"
        title={confirmKind === "all" ? t("sessions.allConfirm.title") : t("sessions.othersConfirm.title")}
        description={
          confirmKind === "all" ? t("sessions.allConfirm.description") : t("sessions.othersConfirm.description")
        }
        confirmLabel={confirmKind === "all" ? t("sessions.allConfirm.confirm") : t("sessions.othersConfirm.confirm")}
        cancelLabel={confirmKind === "all" ? t("sessions.allConfirm.cancel") : t("sessions.othersConfirm.cancel")}
        pendingLabel={t("sessions.revoking")}
        onConfirm={confirmKind === "all" ? signOutEverywhere : revokeOthers}
        error={confirmError}
      />

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={async () => {
          toast(t("password.changed"));
          await reload();
        }}
      />
    </>
  );
}

/** Two-line label for a data row: "Email" over the address. */
function Stacked({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="flex items-center gap-2">
        <span className="truncate text-meta text-muted-foreground">{label}</span>
        {badge}
      </span>
      <span className="truncate text-body text-foreground">{value}</span>
    </span>
  );
}

/**
 * One session in the list. MenuRow has no meta line or action slot, so
 * this mirrors its anatomy (inset divider, 20px muted icon, card padding)
 * with a second line and a trailing button.
 */
function SessionItem({
  icon: Icon,
  title,
  badge,
  meta,
  action,
}: {
  icon: IconComponent;
  title: string;
  badge?: React.ReactNode;
  /** Two facts; they wrap as whole units ("Iniciada a 27 de outubro ·" / "expira a …"). */
  meta: [string, string];
  action?: React.ReactNode;
}) {
  return (
    <li className="relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-12 not-first:before:h-px not-first:before:bg-border">
      <div className="flex min-h-16 items-center gap-3 px-card py-3">
        <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body text-foreground">{title}</span>
            {badge}
          </span>
          <span className="flex flex-wrap gap-x-1 text-meta text-muted-foreground tabular-nums">
            <span>{meta[0]} ·</span>
            <span>{meta[1]}</span>
          </span>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </li>
  );
}

function SessionSkeleton() {
  return (
    <li aria-hidden className="relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-12 not-first:before:h-px not-first:before:bg-border">
      <div className="flex min-h-16 items-center gap-3 px-card py-3">
        <Skeleton className="size-5 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    </li>
  );
}

type PasswordErrors = { current?: string; next?: string; form?: string };

/**
 * "Alterar palavra-passe" — bottom sheet on mobile, dialog from md.
 * revokeOtherSessions: the PRD requires a password change to sign out
 * every other device; this one stays signed in.
 */
function ChangePasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const t = useTranslations("AccountSettingsPage");
  const tv = useTranslations("Auth.validation");
  const ta = useTranslations("Auth");
  const tp = useTranslations("Auth.password");
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [errors, setErrors] = React.useState<PasswordErrors>({});
  const [pending, setPending] = React.useState(false);
  const currentRef = React.useRef<HTMLInputElement>(null);
  const nextRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setCurrent("");
    setNext("");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = newPasswordProblem(next);
    const found: PasswordErrors = {
      current: current ? undefined : tv("passwordRequired"),
      next: problem ? tv(problem) : undefined,
    };
    if (found.current || found.next) {
      setErrors(found);
      (found.current ? currentRef : nextRef).current?.focus();
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (error) {
        const key = changePasswordErrorKey(error);
        if (key === "wrongPassword") {
          setErrors({ current: t("errors.invalidPassword") });
          currentRef.current?.focus();
        } else if (key === "passwordTooShort" || key === "passwordTooLong") {
          setErrors({ next: tv(key) });
          nextRef.current?.focus();
        } else {
          setErrors({ form: key === "rateLimited" ? ta("rateLimited") : t("errors.generic") });
        }
        return;
      }
      onOpenChange(false);
      reset();
      await onChanged();
    } catch (err) {
      console.error(err);
      setErrors({ form: t("errors.generic") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending) return;
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <DialogContent initialFocus={currentRef}>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("password.title")}</DialogTitle>
            <DialogDescription>{t("password.description")}</DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col gap-5">
            <Field id="current-password" label={t("password.current")} error={errors.current}>
              <PasswordInput
                ref={currentRef}
                autoComplete="current-password"
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  if (errors.current) setErrors((s) => ({ ...s, current: undefined }));
                }}
              />
            </Field>
            <Field id="next-password" label={t("password.new")} helper={tp("requirements")} error={errors.next}>
              <PasswordInput
                ref={nextRef}
                autoComplete="new-password"
                value={next}
                onChange={(e) => {
                  setNext(e.target.value);
                  if (errors.next) setErrors((s) => ({ ...s, next: undefined }));
                }}
              />
            </Field>
            {errors.form && <FieldError>{errors.form}</FieldError>}
          </div>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button type="button" variant="ghost" />}>
              {t("password.cancel")}
            </DialogClose>
            <Button type="submit" pending={pending} pendingLabel={t("password.submitting")}>
              {t("password.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
