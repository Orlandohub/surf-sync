import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { readMvpTableCounts, verifyMvpSchemaReadWrite } = await import(
    "@/lib/services/database-smoke"
  );

  await verifyMvpSchemaReadWrite();
  const counts = await readMvpTableCounts();

  console.log("Database smoke test passed.");
  for (const count of counts) {
    console.log(`${count.tableName}: ${count.rowCount}`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
