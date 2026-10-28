import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { listLocations } from "@/lib/services/discovery";
import { Hero } from "@/components/marketing/hero";
import { Audiences } from "@/components/marketing/audiences";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Trust } from "@/components/marketing/trust";
import { Zones } from "@/components/marketing/zones";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

// The root layout's description is shared by every route; the landing
// page — the most indexed one — says exactly what the page says.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HomePage.meta");
  return { description: t("description") };
}

/**
 * Public landing page — a brand surface (DESIGN.md "Brand at the edges").
 * Every claim on it maps to something the product does today; the zone
 * list is read from the database.
 */
export default async function Home() {
  // Authenticated users never see the marketing page — straight to
  // their own dashboard.
  const session = await getSession();
  if (session) {
    redirect(session.user.type === "instructor" ? "/instructor" : "/school");
  }

  const zones = await listLocations();

  return (
    <>
      {/* wrap-break-word: a word wider than its column (browser text at
          200 % on a phone) breaks instead of pushing the page sideways. */}
      <main className="flex flex-1 flex-col wrap-break-word">
        <Hero />
        <Audiences />
        <HowItWorks />
        <Trust />
        <Zones zones={zones} />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
