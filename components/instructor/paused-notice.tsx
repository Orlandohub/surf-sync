"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pause } from "lucide-react";
import { setPausedAction } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

/**
 * Início when the instructor paused their profile: what that means and
 * "Reativar perfil" (the view's one primary). Applies immediately.
 */
export function PausedNotice() {
  const t = useTranslations("InstructorHomePage.paused");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function reactivate() {
    setBusy(true);
    setError(null);
    const res = await setPausedAction(false);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast(t("done"));
    startTransition(() => router.refresh());
  }

  return (
    <section
      aria-labelledby="perfil-pausado"
      className="flex flex-col gap-4 rounded-card border bg-card p-card shadow-card sm:flex-row sm:items-center sm:p-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
        <Pause aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="perfil-pausado" className="text-title-sm text-foreground">
          {t("title")}
        </h2>
        <p className="text-body text-muted-foreground">{t("description")}</p>
        {error && <FieldError className="mt-1">{error}</FieldError>}
      </div>
      <Button
        pending={busy || refreshing}
        pendingLabel={t("reactivating")}
        onClick={reactivate}
        className="max-sm:h-13 max-sm:w-full"
      >
        {t("reactivate")}
      </Button>
    </section>
  );
}
