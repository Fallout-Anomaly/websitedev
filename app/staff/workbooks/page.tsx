import { redirect } from "next/navigation";

export default function LegacyWorkbooksRedirect() {
  redirect("/staff/sheets");
}
