import { redirect } from "next/navigation";

export default function LegacyWorkbooksNewRedirect() {
  redirect("/staff/sheets/new");
}
