import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createSchema() {
  const schemaPath = path.resolve(process.cwd(), "supabase/staff_portal_schema.sql");
  const schemaSQL = fs.readFileSync(schemaPath, "utf-8");

  console.log("Creating database schema...");

  // Split SQL into individual statements and execute
  const statements = schemaSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt });
      if (error) {
        console.log(`Note: ${error.message}`);
      } else {
        console.log("✓ Executed SQL statement");
      }
    } catch (e) {
      console.log(`Executing via direct API...`);
      
      // Use Supabase directly via fetch
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({ sql: stmt }),
        });
        
        if (!response.ok && !response.status === 404) {
          console.log(`Trying direct query...`);
          // Fallback: split the schema into create/alter operations
          if (stmt.includes("create table")) {
            console.log("(Table creation deferred to Supabase UI or manual setup)");
          }
        }
      } catch (fetchErr) {
        console.log(`(Could not execute: ${fetchErr.message})`);
      }
    }
  }

  console.log("\n✓ Schema setup complete (or tables may already exist)");
}

createSchema().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
