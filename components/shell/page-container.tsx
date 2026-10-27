import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The <main> of a product page: centred column aligned with the app bar,
 * screen gutter (`px-gutter`), top breathing room, sections spaced with
 * `gap-section`. The bottom tab bar's space is already handled by the
 * layout (body padding), so don't add it here.
 *
 *   <PageContainer>                      // max-w-5xl — dashboards, lists
 *     <PageHeader title="Reservas" />
 *     <section>…</section>
 *   </PageContainer>
 *
 *   <PageContainer width="narrow">       // max-w-2xl content — forms, settings
 *
 * Both start at the same left edge (under the app bar's logo) and at the
 * top; "narrow" only caps the width of its children. No page centres its
 * content (Conta, "Cria a tua escola" and the 404 all start under the
 * logo), so moving between pages never shifts the column sideways.
 *
 * Pin the screen's one primary above the tab bar with <PinnedCta> from
 * components/ui/pinned-cta (DESIGN.md "One job per screen"); it adds its
 * own height to the page's bottom clearance.
 */
export function PageContainer({
  width = "default",
  className,
  ...props
}: React.ComponentProps<"main"> & { width?: "default" | "narrow" }) {
  return (
    <main
      data-slot="page"
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-section px-gutter pt-6 pb-section md:pt-10",
        // Narrow pages keep a readable column but start under the logo,
        // like every other page: no sideways jump between tabs.
        width === "narrow" && "*:w-full *:max-w-2xl",
        className,
      )}
      {...props}
    />
  );
}
