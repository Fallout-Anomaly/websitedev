import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const workbookArg = process.argv[2];
const workbookPath = workbookArg
  ? path.resolve(process.cwd(), workbookArg)
  : path.resolve(process.cwd(), "../websitedev-main/Fallen_World_Modlist_Final.xlsm");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

if (!fs.existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function excelDateToISO(value) {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    // Excel serial date (1900 system): day 0 is 1899-12-30
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + value * 24 * 60 * 60 * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  const maybeDate = new Date(value);
  if (Number.isNaN(maybeDate.getTime())) return null;
  return maybeDate.toISOString().slice(0, 10);
}

function isBlankRow(cells) {
  return cells.every((cell) => normalizeText(cell) === null);
}

function parseModlistRows(sheetRows, sourceFileName) {
  const dataRows = sheetRows.slice(1);

  return dataRows
    .map((row, index) => {
      if (isBlankRow(row)) return null;

      const modName = normalizeText(row[1]);
      if (!modName) return null;

      return {
        load_order: normalizeNumber(row[0]),
        mod_name: modName,
        status: normalizeText(row[2]),
        category: normalizeText(row[3]),
        author: normalizeText(row[4]),
        version: normalizeText(row[5]),
        nexus_url: normalizeText(row[6]),
        size_mb: normalizeNumber(row[7]),
        esp_count: normalizeNumber(row[8]) ?? 0,
        esm_count: normalizeNumber(row[9]) ?? 0,
        esl_count: normalizeNumber(row[10]) ?? 0,
        notes: normalizeText(row[11]),
        source_file: sourceFileName,
        source_row: index + 2,
      };
    })
    .filter(Boolean);
}

function parseBugRows(sheetRows, sourceFileName) {
  const dataRows = sheetRows.slice(1);

  return dataRows
    .map((row, index) => {
      if (isBlankRow(row)) return null;

      return {
        date_reported: excelDateToISO(row[0]),
        reported_by: normalizeText(row[1]),
        mod_name: normalizeText(row[2]),
        issue_description: normalizeText(row[3]),
        severity: normalizeText(row[4]),
        status: normalizeText(row[5]) ?? "New",
        resolution_notes: normalizeText(row[6]),
        source_file: sourceFileName,
        source_row: index + 2,
      };
    })
    .filter(Boolean);
}

async function insertInBatches(table, rows, batchSize = 200) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);

    if (error) {
      throw new Error(`Failed inserting into ${table}: ${error.message}`);
    }
  }
}

async function run() {
  console.log(`Reading workbook: ${workbookPath}`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(workbookPath);
  const sourceFileName = path.basename(workbookPath);

  const modlistSheet = wb.getWorksheet("Modlist");
  const bugSheet = wb.getWorksheet("Bug Tracker");

  if (!modlistSheet || !bugSheet) {
    throw new Error("Workbook must contain sheets named 'Modlist' and 'Bug Tracker'.");
  }

  function worksheetToRows(ws) {
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      // row.values is 1-indexed; index 0 is always empty.
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values.map((v) => (v === undefined ? "" : v)));
    });
    return rows;
  }

  const modlistRowsRaw = worksheetToRows(modlistSheet);
  const bugRowsRaw = worksheetToRows(bugSheet);

  const modRows = parseModlistRows(modlistRowsRaw, sourceFileName);
  const bugRows = parseBugRows(bugRowsRaw, sourceFileName);

  console.log(`Parsed mod rows: ${modRows.length}`);
  console.log(`Parsed bug rows: ${bugRows.length}`);

  const { error: modDeleteError } = await supabase
    .from("modlist_entries")
    .delete()
    .eq("source_file", sourceFileName);

  if (modDeleteError) {
    throw new Error(
      `Could not clear existing modlist rows. Did you run supabase/staff_portal_schema.sql? ${modDeleteError.message}`
    );
  }

  const { error: bugDeleteError } = await supabase
    .from("bug_reports")
    .delete()
    .eq("source_file", sourceFileName);

  if (bugDeleteError) {
    throw new Error(
      `Could not clear existing bug rows. Did you run supabase/staff_portal_schema.sql? ${bugDeleteError.message}`
    );
  }

  await insertInBatches("modlist_entries", modRows);
  await insertInBatches("bug_reports", bugRows);

  console.log("Import complete.");
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
