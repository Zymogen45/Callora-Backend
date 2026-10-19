import type Database from "better-sqlite3";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { getEmbeddedAssets } from "../lib/embeddedAssets.js";

/**
 * Demo / serverless bootstrap.
 *
 * The `migrations/` folder contains a mix of SQLite and PostgreSQL migrations
 * (production uses Postgres for metering/billing; the catalog + developer
 * profile layer uses SQLite via Drizzle). In demo mode we apply every
 * numbered migration file on a best-effort basis against an ephemeral SQLite
 * database and skip files that are not SQLite compatible, then seed a small
 * catalog so the public endpoints return real content.
 */
export function bootstrapDemoDb(sqlite: Database.Database, migrationDir: string): void {
  const embedded = getEmbeddedAssets()?.migrations;
  const files = (embedded ? Object.keys(embedded) : readdirSync(migrationDir))
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql") && /^\d+/.test(f))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));

  let applied = 0;
  for (const file of files) {
    try {
      sqlite.exec(embedded ? embedded[file] : readFileSync(join(migrationDir, file), "utf8"));
      applied++;
    } catch {
      // Postgres-only migration (or already satisfied): skip in demo mode.
    }
  }
  console.log(`[demo] applied ${applied}/${files.length} SQLite-compatible migrations`);

  const hasDev = sqlite.prepare("SELECT 1 FROM developers LIMIT 1").get();
  if (hasDev) return;

  sqlite
    .prepare("INSERT INTO developers (user_id, name, website, description, category) VALUES (?,?,?,?,?)")
    .run("demo-dev", "Callora Demo Labs", "https://callora.example", "Demo developer account", "data");

  const insertApi = sqlite.prepare(
    "INSERT INTO apis (developer_id, name, description, base_url, category, status) VALUES (1,?,?,?,?, 'active')",
  );
  const insertEp = sqlite.prepare(
    "INSERT INTO api_endpoints (api_id, path, method, price_per_call_usdc, description) VALUES (?,?,?,?,?)",
  );
  const seed: Array<[string, string, string, string, Array<[string, string, string, string]>]> = [
    ["Stellar Price Oracle", "Real-time XLM and asset price feeds", "https://oracle.example/v1", "finance",
      [["/price/{asset}", "GET", "0.002", "Latest price for an asset"], ["/history", "GET", "0.01", "Historical OHLC data"]]],
    ["Soroban Contract Analytics", "Invocation and fee analytics for Soroban contracts", "https://analytics.example/v1", "analytics",
      [["/contracts/{id}/stats", "GET", "0.005", "Contract usage statistics"]]],
    ["Geo Lookup", "IP to location lookup", "https://geo.example/v1", "data",
      [["/ip/{address}", "GET", "0.001", "Resolve an IP address"]]],
  ];
  for (const [name, desc, url, cat, eps] of seed) {
    const id = Number(insertApi.run(name, desc, url, cat).lastInsertRowid);
    for (const [p, m, price, d] of eps) insertEp.run(id, p, m, price, d);
  }
  console.log("[demo] seeded demo catalog");
}
