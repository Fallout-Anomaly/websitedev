import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL.");
  }

  // `pg` parses connectionString using WHATWG URL; passwords with special characters
  // must be percent-encoded. If the env var isn't encoded (common after copy/paste),
  // try to encode just the password segment.
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {
    // Robust fallback that doesn't assume password lacks ':' or '@'.
    // Format: postgres://USER:PASSWORD@HOST/DB?query...
    const schemeIdx = url.indexOf("://");
    if (schemeIdx === -1) return url;

    const scheme = url.slice(0, schemeIdx + 3); // incl ://
    const afterScheme = url.slice(schemeIdx + 3);
    const atIdx = afterScheme.lastIndexOf("@");
    if (atIdx === -1) return url;

    const auth = afterScheme.slice(0, atIdx);
    const rest = afterScheme.slice(atIdx + 1);
    const colonIdx = auth.indexOf(":");
    if (colonIdx === -1) return url;

    const user = auth.slice(0, colonIdx);
    const password = auth.slice(colonIdx + 1);
    return `${scheme}${user}:${encodeURIComponent(password)}@${rest}`;
  }
}

function stripSslMode(connectionString: string) {
  try {
    const u = new URL(connectionString);
    // `pg-connection-string` treats sslmode=require as verify-full in some versions,
    // which can break local dev with certain TLS chains. We control TLS via Pool.ssl.
    u.searchParams.delete("sslmode");
    u.searchParams.delete("sslrootcert");
    return u.toString();
  } catch {
    return connectionString;
  }
}

function getSslConfig():
  | { rejectUnauthorized: false }
  | { rejectUnauthorized: true; ca: string } {
  // Default: local dev is permissive to avoid TLS chain issues on Windows.
  // Opt into strict verification by setting DATABASE_SSL_VERIFY=true.
  if (process.env.DATABASE_SSL_VERIFY !== "true") {
    return { rejectUnauthorized: false };
  }

  const caPath = path.resolve(process.cwd(), "prod-ca-2021.crt");
  const ca = fs.readFileSync(caPath, "utf8");
  return { rejectUnauthorized: true, ca };
}

declare global {
  // eslint-disable-next-line no-var
  var __drizzlePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: ReturnType<typeof drizzle> | undefined;
}

function getPool() {
  // In dev with HMR, avoid creating many pools.
  if (!globalThis.__drizzlePool) {
    globalThis.__drizzlePool = new Pool({
      connectionString: stripSslMode(getDatabaseUrl()),
      ssl: getSslConfig(),
    });
  }
  return globalThis.__drizzlePool;
}

export function getDb() {
  if (!globalThis.__drizzleDb) {
    globalThis.__drizzleDb = drizzle(getPool());
  }
  return globalThis.__drizzleDb;
}

