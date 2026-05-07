import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16 text-center text-slate-100">
      <h1 className="text-xl font-semibold">Sign-in link invalid</h1>
      <p className="mt-3 text-sm text-slate-400">
        This link may have expired or already been used. Request a new one from
        the login or account page.
      </p>
      <Link
        href="/login"
        className="mt-8 text-sm text-emerald-400 hover:text-emerald-300"
      >
        Back to sign in
      </Link>
    </main>
  );
}
