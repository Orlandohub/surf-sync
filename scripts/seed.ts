import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";

loadEnvConfig(process.cwd());

// Launch zones, by district. Keep in sync with scripts/seed-locations.sql.
const launchLocations = [
  { name: "Nazaré", region: "Leiria" },
  { name: "Peniche", region: "Leiria" },
  { name: "Ericeira", region: "Lisboa" },
  { name: "Guincho", region: "Lisboa" },
  { name: "Cascais", region: "Lisboa" },
  { name: "Carcavelos", region: "Lisboa" },
  { name: "Costa da Caparica", region: "Setúbal" },
  { name: "Costa da Caparica Norte", region: "Setúbal" },
  { name: "Sesimbra", region: "Setúbal" },
];

async function main() {
  const [{ db }, { location }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema/app"),
  ]);

  await db
    .insert(location)
    .values(launchLocations)
    .onConflictDoUpdate({
      target: location.name,
      set: { region: sql`excluded.region` },
    });
}

main()
  .then(() => {
    console.log("Seeded launch locations.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
