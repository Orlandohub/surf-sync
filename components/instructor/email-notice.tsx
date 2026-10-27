import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResendVerification } from "@/components/instructor/resend-verification";
import type { ResendStart } from "@/components/auth/resend-verification";

/**
 * Início while the instructor's email isn't confirmed — before and after
 * the profile goes live. Confirming doesn't gate activation (the services
 * don't check it), but booking requests are emailed to this address, so
 * Início keeps asking until it is confirmed: where the link went and
 * "Reenviar email" (outline; the view's primary is elsewhere). `start` is
 * the server's read of the email budget (resendStartFor), so the
 * countdown starts from what was already sent.
 */
export function EmailNotice({
  email,
  start,
  className,
}: {
  email: string;
  start?: ResendStart;
  className?: string;
}) {
  const t = useTranslations("InstructorHomePage.email");

  return (
    <section
      aria-labelledby="confirmar-email"
      className={cn(
        "flex items-start gap-4 rounded-card border bg-card p-card shadow-card sm:p-6",
        className,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-tint-foreground max-sm:hidden">
        <Mail aria-hidden className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="confirmar-email" className="text-title-sm text-foreground">
          {t("title")}
        </h2>
        <p className="text-body break-words text-muted-foreground">{t("description", { email })}</p>
        <ResendVerification email={email} start={start} />
      </div>
    </section>
  );
}
