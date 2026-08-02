// Fails the build early with a clear message instead of shipping a broken client bundle —
// NEXT_PUBLIC_* vars are inlined at build time, so a missing one only surfaces later as a
// silent runtime failure (blank API base, Auth0 redirect loop) if we don't catch it here.
//
// This script runs in a plain `node` process (via the `prebuild` hook), which does NOT get
// Next.js's automatic .env.local loading the way `next build`/`next dev` do — so we load it
// the same way Next.js itself does, via its own @next/env helper, instead of duplicating
// that logic (or requiring a dotenv dependency) here.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const REQUIRED_VARS = [
  "NEXT_PUBLIC_API_BASE",
  "NEXT_PUBLIC_AUTH0_DOMAIN",
  "NEXT_PUBLIC_AUTH0_CLIENT_ID",
  "NEXT_PUBLIC_AUTH0_AUDIENCE",
];

const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  for (const name of missing) console.error(`   - ${name}`);
  console.error("\nSet them in .env.local (see .env.local.example) before building.\n");
  process.exit(1);
}

console.log("✅ Environment variables OK.");
