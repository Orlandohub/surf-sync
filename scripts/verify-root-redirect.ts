// Verify "/" redirects authenticated users to their dashboard.
// Read-only: signs in REAL existing accounts if provided via env, else
// only checks the anonymous path (no data created — prod-safe).
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3000";
const API = `${BASE}/api/auth`;

function fail(label: string, detail: unknown): never {
  console.error(`✗ ${label}:`, detail);
  process.exit(1);
}

async function main() {
  // 1. Anonymous: landing renders (no redirect).
  const anon = await fetch(`${BASE}/`, { redirect: "manual" });
  if (anon.status !== 200) fail("anon /", anon.status);
  const html = await anon.text();
  if (!html.includes("Criar conta")) fail("anon landing", "CTAs missing");
  console.log("✓ 1. anonymous / renders the landing page");

  // 2. Authenticated: redirects to the type dashboard.
  const email = process.env.VERIFY_EMAIL;
  const password = process.env.VERIFY_PASSWORD;
  if (!email || !password) {
    console.log("… 2. skipped (set VERIFY_EMAIL/VERIFY_PASSWORD to test the redirect)");
    console.log("\nRoot redirect: VERIFIED (anonymous path)");
    return;
  }
  const signin = await fetch(`${API}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  if (signin.status !== 200) fail("signin", signin.status);
  const cookie = signin.headers.get("set-cookie")?.split(";")[0] ?? "";

  const res = await fetch(`${BASE}/`, { redirect: "manual", headers: { Cookie: cookie } });
  const loc = res.headers.get("location") ?? "";
  if (res.status !== 307 && res.status !== 302) fail("auth / status", res.status);
  if (!/\/(instructor|school)$/.test(loc)) fail("auth / target", loc);
  console.log(`✓ 2. authenticated / redirects to ${loc}`);

  console.log("\nRoot redirect: VERIFIED");
}
main();
