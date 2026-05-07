import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { safeInternalPath } from "@/src/lib/safe-auth-redirect";

type SearchParams = {
  next?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const rawNext = params.next;
  const nextPath = safeInternalPath(
    Array.isArray(rawNext) ? rawNext[0] : rawNext,
    "/staff"
  );

  const allowPublicAuth =
    nextPath.startsWith("/account") || nextPath.startsWith("/auth/");

  if (user) {
    if (allowPublicAuth) {
      redirect(nextPath);
    }
    if (await isStaffAccount(supabase, user)) {
      redirect("/staff");
    }
    redirect("/");
  }

  const requireStaffPortal = !allowPublicAuth;

  return (
    <LoginForm
      nextPath={nextPath}
      requireStaffPortal={requireStaffPortal}
    />
  );
}
