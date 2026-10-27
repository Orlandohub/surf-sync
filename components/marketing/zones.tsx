import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { DisplayHeading, marketingColumn, marketingSection } from "@/components/marketing/primitives";

export type Zone = { id: string; name: string; region: string };

type RegionKey = "leiria" | "lisboa" | "setubal" | "other";

// Presentation knowledge only: the coast from north to south and the
// district each zone sits in, keyed by zone name. The zones themselves
// come from the database. The DB `region` column is never printed (an
// older seed wrote an English "Lisbon area"), so headings come from this
// map and next-intl instead. Keep in step with scripts/seed.ts.
const COAST: readonly (readonly [string, RegionKey])[] = [
  ["Nazaré", "leiria"],
  ["Peniche", "leiria"],
  ["Ericeira", "lisboa"],
  ["Guincho", "lisboa"],
  ["Cascais", "lisboa"],
  ["Carcavelos", "lisboa"],
  ["Costa da Caparica Norte", "setubal"],
  ["Costa da Caparica", "setubal"],
  ["Sesimbra", "setubal"],
];
const REGIONS: readonly RegionKey[] = ["leiria", "lisboa", "setubal", "other"];

// A zone not in COAST joins its district when the DB region names one
// we know (after the known zones), otherwise "Outras zonas" at the end.
const REGION_BY_DB_NAME: Record<string, RegionKey> = {
  Leiria: "leiria",
  Lisboa: "lisboa",
  Setúbal: "setubal",
};

function coastRank(name: string) {
  const i = COAST.findIndex(([known]) => known === name);
  return i === -1 ? COAST.length : i;
}

function regionOf(zone: Zone): RegionKey {
  const known = COAST.find(([name]) => name === zone.name);
  return known ? known[1] : (REGION_BY_DB_NAME[zone.region] ?? "other");
}

function byCoast(zones: Zone[]) {
  return REGIONS.map((region) => ({
    region,
    zones: zones
      .filter((zone) => regionOf(zone) === region)
      .sort((a, b) => coastRank(a.name) - coastRank(b.name) || a.name.localeCompare(b.name, "pt")),
  })).filter((group) => group.zones.length > 0);
}

/**
 * The zones instructors can pick and schools search by — read from the
 * `location` table, grouped by district and drawn as a line down the coast.
 */
export async function Zones({ zones }: { zones: Zone[] }) {
  if (zones.length === 0) return null;
  const t = await getTranslations("HomePage.zones");
  const groups = byCoast(zones);

  return (
    <section aria-labelledby="zonas" className={cn(marketingColumn, marketingSection)}>
      <DisplayHeading id="zonas">{t("title")}</DisplayHeading>
      <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">{t("intro")}</p>

      <div
        className={cn(
          "mt-12 grid grid-cols-1 gap-8 sm:gap-6 md:mt-16",
          groups.length > 3 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        {groups.map(({ region, zones: list }) => (
          <div key={region} className="flex min-w-0 flex-col gap-4">
            <h3 className="text-meta text-muted-foreground">{t(`regions.${region}`)}</h3>
            <ul className="flex flex-col">
              {list.map((zone) => (
                <li key={zone.id} className="flex gap-4 text-title-sm">
                  {/* Rail: one continuous line, and a dot centred on the
                      name's first line (same top padding, one line tall). */}
                  <span aria-hidden className="relative flex w-2.5 shrink-0 justify-center">
                    <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-brand-water" />
                    <span className="relative mt-2.5 flex h-lh items-center">
                      <span className="size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    </span>
                  </span>
                  <span className="min-w-0 py-2.5">{zone.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
