import Link from 'next/link';

export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-muted">404</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] leading-tight">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <p className="mt-8">
        <Link href="/" className="btn btn-primary">
          Return to the homepage
        </Link>
      </p>
    </main>
  );
}
