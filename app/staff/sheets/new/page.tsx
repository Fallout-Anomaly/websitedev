import Link from "next/link";
import SheetLinkForm from "./SheetLinkForm";

export default function NewStaffSheetPage() {
  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <Link href="/staff/sheets" className="text-[#8b949e] hover:text-[#58a6ff]">
          Google Sheets
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">New</span>
      </nav>

      <header className="mb-8 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Add Google Sheet
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
          Link a document your team edits in Google Sheets. Use category and
          notes here for organization; use comments for short staff discussion.
        </p>
      </header>

      <SheetLinkForm />
    </>
  );
}
