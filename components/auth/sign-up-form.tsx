"use client";

import * as React from "react";
import Link from "next/link";
import { MailCheck, School, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { PasswordInput } from "@/components/auth/password-input";
import { ResendVerification } from "@/components/auth/resend-verification";
import { AuthAltLink, AuthStateIcon, authTextLinkClass } from "@/components/auth/auth-parts";
import { AuthStateScreen } from "@/components/auth/auth-state";
import {
  ACCOUNT_TYPES,
  emailProblem,
  homeFor,
  newPasswordProblem,
  signUpErrorKey,
  type AccountType,
} from "@/components/auth/auth-helpers";
import type { IconComponent } from "@/components/brand/icons";

type Errors = { name?: string; email?: React.ReactNode; password?: string; form?: string };

const TYPE_ICON: Record<AccountType, IconComponent> = {
  school_staff: School,
  instructor: UserRound,
};

/**
 * Sign-up: choose the account type (two radio cards — a real choice, no
 * default unless the URL brings one: /sign-up?type=instructor), then the
 * form appears below it. The type is immutable after sign-up.
 *
 * Staff invitations: the invitation email links to /sign-up (built in
 * lib/actions/school.ts; ?type=school_staff preselects "Escola de surf");
 * the invite is accepted automatically when the invited address signs up
 * as "Escola de surf" and opens /school (lib/services/school.ts). The
 * email field says so when that type is chosen.
 */
export function SignUpForm({ defaultType = null }: { defaultType?: AccountType | null }) {
  const t = useTranslations("SignUpPage");
  const tv = useTranslations("Auth.validation");
  const ta = useTranslations("Auth");
  const tp = useTranslations("Auth.password");
  const [accountType, setAccountType] = React.useState<AccountType | null>(defaultType);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState<{ email: string; at: number; type: AccountType } | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const typeLabelId = React.useId();

  function clear(key: keyof Errors) {
    if (errors[key]) setErrors((s) => ({ ...s, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;

    const emailIssue = emailProblem(email);
    const passwordIssue = newPasswordProblem(password);
    const next: Errors = {
      name: name.trim() ? undefined : tv("nameRequired"),
      email: emailIssue ? tv(emailIssue) : undefined,
      password: passwordIssue ? tv(passwordIssue) : undefined,
    };
    if (next.name || next.email || next.password) {
      setErrors(next);
      (next.name ? nameRef : next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        type: accountType,
        callbackURL: "/verify-email",
      });

      if (error) {
        const key = signUpErrorKey(error);
        if (key === "emailTaken") {
          setErrors({
            email: t.rich("errors.emailTaken", {
              link: (chunks) => (
                <Link href="/sign-in" className={authTextLinkClass}>
                  {chunks}
                </Link>
              ),
            }),
          });
          emailRef.current?.focus();
        } else if (key === "emailInvalid") {
          setErrors({ email: tv("emailInvalid") });
          emailRef.current?.focus();
        } else if (key === "passwordTooShort" || key === "passwordTooLong") {
          setErrors({ password: tv(key) });
          passwordRef.current?.focus();
        } else {
          setErrors({ form: key === "rateLimited" ? ta("rateLimited") : t("errors.generic") });
        }
        return;
      }

      // Better Auth sends the confirmation email on sign-up (sendOnSignUp)
      // and signs the person in (autoSignIn; no sign-in wall).
      setSent({ email: email.trim(), at: Date.now(), type: accountType });
    } catch (err) {
      // Network-level failure: better-fetch only converts HTTP errors into
      // { error }; transport errors reject the promise.
      console.error(err);
      setErrors({ form: t("errors.generic") });
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    // The person is signed in already; "Continuar" reloads into the app so
    // the server-rendered app bar shows the session (a client transition
    // would keep the signed-out bar, and refreshing /sign-up redirects).
    return (
      <AuthStateScreen focusOnMount>
        <div className="flex flex-col gap-5">
          <AuthStateIcon icon={MailCheck} />
          <PageHeader
            title={t("done.title")}
            description={t.rich("done.description", {
              email: sent.email,
              strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
            })}
          />
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-meta text-muted-foreground">{t("done.spam")}</p>
          <ResendVerification email={sent.email} start={{ sentAt: sent.at, sentCount: 1 }} />
        </div>
        <AuthAltLink lead={t("done.later")} href={homeFor(sent.type)} reload>
          {t("done.continue")}
        </AuthAltLink>
      </AuthStateScreen>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label id={typeLabelId}>{t("accountType.label")}</Label>
          <RadioGroup
            aria-labelledby={typeLabelId}
            value={accountType}
            onValueChange={(value) => setAccountType(value as AccountType)}
            className="flex flex-col gap-3"
          >
            {ACCOUNT_TYPES.map((type) => (
              <AccountTypeCard
                key={type}
                value={type}
                icon={TYPE_ICON[type]}
                title={t(`accountType.${type}.title`)}
                description={t(`accountType.${type}.description`)}
              />
            ))}
          </RadioGroup>
        </div>

        {accountType && (
          <div className="flex animate-rise flex-col gap-5">
            <Field id="name" label={t("name.label")} error={errors.name}>
              <Input
                ref={nameRef}
                autoComplete="name"
                placeholder={t("name.placeholder")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clear("name");
                }}
              />
            </Field>

            <Field
              id="email"
              label={t("email.label")}
              helper={accountType === "school_staff" ? t("email.inviteHelper") : undefined}
              error={errors.email}
            >
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
                  clear("email");
                }}
              />
            </Field>

            <Field id="password" label={t("password.label")} helper={tp("requirements")} error={errors.password}>
              <PasswordInput
                ref={passwordRef}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear("password");
                }}
              />
            </Field>

            {errors.form && <FieldError>{errors.form}</FieldError>}

            <Button type="submit" size="lg" className="mt-1" pending={pending} pendingLabel={t("submitting")}>
              {t("submit")}
            </Button>
          </div>
        )}
      </form>

      <AuthAltLink lead={t("haveAccount")} href="/sign-in">
        {t("signIn")}
      </AuthAltLink>
    </div>
  );
}

/**
 * One account-type choice: a large card that is a radio (role="radio" +
 * aria-checked; the group handles arrow keys / roving focus, and Space
 * checks the focused card). Selected: teal border, tonal fill, filled icon
 * and radio dot.
 *
 * A size container: below 16rem (a phone at 125% text and more) the
 * decorative icon goes and the radio dot moves to the top-right corner,
 * beside the title, so the text keeps the card's width and nothing sits
 * on top of it.
 */
function AccountTypeCard({
  value,
  icon: Icon,
  title,
  description,
}: {
  value: AccountType;
  icon: IconComponent;
  title: string;
  description: string;
}) {
  const id = React.useId();
  return (
    <Radio
      value={value}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className={
        "group @container relative flex cursor-pointer items-center gap-4 rounded-card border bg-card p-card text-left shadow-card outline-none select-none " +
        "transition-[background-color,border-color,transform] duration-(--duration-fast) ease-move hover:border-input active:scale-99 " +
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
        "data-checked:border-primary data-checked:bg-secondary data-checked:hover:border-primary"
      }
    >
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-tint-foreground transition-colors duration-(--duration-fast) group-data-checked:bg-primary group-data-checked:text-primary-foreground @max-3xs:hidden"
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 hyphens-auto">
        <span id={`${id}-title`} className="text-label break-words text-foreground @max-3xs:pr-8">
          {title}
        </span>
        <span id={`${id}-description`} className="text-meta break-words text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input bg-card transition-colors duration-(--duration-fast) group-data-checked:border-primary @max-3xs:absolute @max-3xs:top-card @max-3xs:right-card"
      >
        <span className="size-2.5 scale-0 rounded-full bg-primary transition-transform duration-(--duration-instant) ease-move group-data-checked:scale-100" />
      </span>
    </Radio>
  );
}
