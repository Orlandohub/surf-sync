import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const launchLocations = [
  { name: "Cascais", region: "Lisbon area" },
  { name: "Costa da Caparica", region: "Lisbon area" },
  { name: "Ericeira", region: "Lisbon area" },
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
      set: { region: "Lisbon area" },
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
