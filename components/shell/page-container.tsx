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
 *   <PageContainer width="narrow">       // max-w-2xl — forms, settings
 *
 * Pin a mobile CTA above the tab bar with
 * `sticky bottom-(--bottom-chrome)` (DESIGN.md "One job per screen").
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
        "mx-auto flex w-full flex-1 flex-col gap-section px-gutter pt-6 pb-section md:pt-10",
        width === "narrow" ? "max-w-2xl" : "max-w-5xl",
        className,
      )}
      {...props}
    />
  );
}
