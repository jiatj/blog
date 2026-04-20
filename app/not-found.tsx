import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
      <p className="mt-4 max-w-xl text-base text-[var(--muted-foreground)]">
        这个页面不存在，或者它已经被移动。You can return to the main
        entrance and continue exploring the site.
      </p>
      <Link
        className="mt-8 rounded-full border border-[var(--border)] px-5 py-3 text-sm transition hover:bg-[var(--accent-soft)]"
        href="/zh"
      >
        Back to home
      </Link>
    </main>
  );
}
