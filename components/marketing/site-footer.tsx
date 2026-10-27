import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/logo";
import { lisbonToday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { marketingColumn } from "@/components/marketing/primitives";

const footerLink =
  "inline-flex min-h-11 items-center rounded-chip text-label text-foreground outline-none transition-colors duration-(--duration-fast) hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Landing-page footer: lockup, one line, the two ways in, copyright. */
export async function SiteFooter() {
  const t = await getTranslations("HomePage");
  const year = lisbonToday().slice(0, 4);

  return (
    <footer className="mt-16 border-t md:mt-24">
      <div className={cn(marketingColumn, "flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between md:py-12")}>
        <div className="flex flex-col gap-3">
          <LogoLockup height={24} className="text-foreground" />
          <p className="text-body text-muted-foreground">{t("footer.line")}</p>
        </div>
        <nav aria-label={t("footer.nav")}>
          <ul className="flex gap-6">
            <li>
              <Link href="/sign-in" className={footerLink}>
                {t("cta.signIn")}
              </Link>
            </li>
            <li>
              <Link href="/sign-up" className={footerLink}>
                {t("cta.signUp")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className={cn(marketingColumn, "pb-10")}>
        <p className="border-t pt-6 text-meta text-muted-foreground tabular-nums">
          {t("footer.copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
