"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteStaffSheet } from "./actions";

export default function DeleteSheetButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Remove this sheet link from the staff library?")) return;
        setBusy(true);
        const r = await deleteStaffSheet(slug);
        setBusy(false);
        if (r.error) {
          alert(r.error);
          return;
        }
        router.push("/staff/sheets");
        router.refresh();
      }}
      className="rounded-md border border-[#f85149]/35 px-3 py-1.5 text-sm font-medium text-[#ff7b72] transition-colors hover:bg-[#f85149]/10 disabled:opacity-50"
    >
      {busy ? "…" : "Remove"}
    </button>
  );
}
