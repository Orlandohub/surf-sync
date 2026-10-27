"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setPausedAction } from "@/lib/actions/instructor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

/**
 * "Reativar perfil" for a paused profile that still has availability (the
 * service refuses otherwise: callers link to Disponibilidade instead).
 * Applies immediately; a failure shows under the button.
 */
export function ReactivateButton({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
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
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Button
        pending={busy || refreshing}
        pendingLabel={t("reactivating")}
        onClick={reactivate}
        className={buttonClassName}
      >
        {t("reactivate")}
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
