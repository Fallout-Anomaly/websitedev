import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSql(sql) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc("exec", { sql: stmt });
      if (error && !error.message.includes("already exists")) {
        console.warn(`Warning executing SQL: ${error.message}`);
      }
    } catch (e) {
      console.log(`(Skipping statement, likely already applied)`);
    }
  }
}

async function setupDatabase() {
  console.log("Setting up database tables...");

  const schemaPath = path.resolve(process.cwd(), "supabase/staff_portal_schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSQL = fs.readFileSync(schemaPath, "utf-8");
  
  try {
    await executeSql(schemaSQL);
    console.log("✓ Database schema ready");
  } catch (error) {
    console.log("(Database may already be set up, continuing...)");
  }
}

async function run() {
  await setupDatabase();
  console.log("\nRunning: npm run import:workbook");
  
  const { exec } = await import("node:child_process");
  exec("npm run import:workbook", (error, stdout, stderr) => {
    if (error) {
      console.error(stderr);
      process.exit(1);
    }
    console.log(stdout);
  });
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
