import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UpdatePasswordForm from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/auth/update-password");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Set new password
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        You opened a recovery link. Choose a new password below.
      </p>
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <UpdatePasswordForm />
      </div>
      <Link
        href="/account"
        className="mt-8 text-center text-sm text-slate-500 hover:text-slate-300"
      >
        ← Account settings
      </Link>
    </main>
  );
}
