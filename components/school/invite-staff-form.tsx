"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { inviteStaffAction } from "@/lib/actions/school";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite a colleague by email (Equipa). Outline "Convidar" — the screen's
 * filled primary is "Encontrar instrutores". The server's refusal ("Essa
 * pessoa já pertence a uma escola.") shows inline on the field.
 */
export function InviteStaffForm() {
  const t = useTranslations("SchoolDashboardPage.team");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [, startTransition] = React.useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError(t("invalidEmail"));
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setPending(true);
    const res = await inviteStaffAction({ email: value });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      inputRef.current?.focus();
      return;
    }
    toast(t("invited"));
    setEmail("");
    startTransition(() => router.refresh());
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Field label={t("inviteLabel")} helper={t("inviteHelper")} error={error} id="invite-email">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="email"
            name="email"
            autoComplete="off"
            placeholder={t("invitePlaceholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
          />
          <Button type="submit" variant="outline" className="h-12" pending={pending}>
            {t("invite")}
          </Button>
        </div>
      </Field>
    </form>
  );
}
