import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        We will email you a link to set a new password.
      </p>
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <ForgotPasswordForm />
      </div>
      <Link
        href="/login"
        className="mt-8 text-center text-sm text-slate-500 hover:text-slate-300"
      >
        ← Back to sign in
      </Link>
    </main>
  );
}
