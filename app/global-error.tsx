"use client";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;

  return (
    <html>
      <body className="min-h-screen bg-black text-[#e3e3e3] font-sans px-6 py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Something went wrong
          </h1>
          {error?.digest ? (
            <p className="mt-4 text-xs text-gray-500">
              Digest:{" "}
              <code className="rounded bg-white/10 px-1">{error.digest}</code>
            </p>
          ) : null}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded border-2 border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-emerald-500"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded border-2 border-[#2e2e2e] bg-black px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2e2e2e]"
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

