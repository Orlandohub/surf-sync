import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { DisplayHeading, marketingColumn, marketingSection } from "@/components/marketing/primitives";

export type Zone = { id: string; name: string; region: string };

// Presentation order only: the coast read from north to south. The
// zones themselves come from the database, so a new one still shows up
// (after the known ones of its region, or in a new region at the end).
const REGION_ORDER = ["Leiria", "Lisboa", "Setúbal"];
const COAST_ORDER = [
  "Nazaré",
  "Peniche",
  "Ericeira",
  "Guincho",
  "Carcavelos",
  "Costa da Caparica Norte",
  "Costa da Caparica",
  "Sesimbra",
];

function rank(order: string[], value: string) {
  const i = order.indexOf(value);
  return i === -1 ? order.length : i;
}

function byCoast(zones: Zone[]) {
  const regions = new Map<string, Zone[]>();
  for (const zone of zones) {
    regions.set(zone.region, [...(regions.get(zone.region) ?? []), zone]);
  }
  return [...regions.entries()]
    .sort(([a], [b]) => rank(REGION_ORDER, a) - rank(REGION_ORDER, b) || a.localeCompare(b, "pt"))
    .map(([region, list]) => ({
      region,
      zones: list.sort(
        (a, b) => rank(COAST_ORDER, a.name) - rank(COAST_ORDER, b.name) || a.name.localeCompare(b.name, "pt"),
      ),
    }));
}

/**
 * The zones instructors can pick and schools search by — read from the
 * `location` table, grouped by region and drawn as a line down the coast.
 */
export async function Zones({ zones }: { zones: Zone[] }) {
  if (zones.length === 0) return null;
  const t = await getTranslations("HomePage.zones");
  const groups = byCoast(zones);

  return (
    <section aria-labelledby="zonas" className={cn(marketingColumn, marketingSection)}>
      <DisplayHeading id="zonas">{t("title")}</DisplayHeading>
      <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">{t("intro")}</p>

      <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6 md:mt-16">
        {groups.map(({ region, zones: list }) => (
          <div key={region} className="flex flex-col gap-4">
            <h3 className="text-meta text-muted-foreground">{region}</h3>
            <ul className="ml-1 flex flex-col border-l-2 border-brand-water pl-6">
              {list.map((zone) => (
                <li key={zone.id} className="relative py-2.5 text-title-sm">
                  <span
                    aria-hidden
                    className="absolute top-5.5 -left-6.25 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background"
                  />
                  {zone.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
