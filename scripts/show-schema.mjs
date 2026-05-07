import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/run_query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "X-Client-Info": "import-script/1.0",
    },
    body: JSON.stringify({ query: sql }),
  });

  return response;
}

async function setup() {
  console.log("Creating Supabase tables...");
  console.log("Note: Execute this SQL manually in Supabase Dashboard > SQL Editor:");
  console.log("---");

  const schemaPath = path.resolve(process.cwd(), "supabase/staff_portal_schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  console.log(sql);
  console.log("---");
  console.log(
    "\nTo complete setup:\n1. Go to https://app.supabase.com\n2. Open your project > SQL Editor\n3. Click 'New Query'\n4. Paste the SQL above\n5. Click 'Run'"
  );
}

setup();
