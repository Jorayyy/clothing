import Link from 'next/link';

import { cn } from '@/lib/utils';

export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-xs uppercase tracking-[0.16em] text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
        </li>
        {trail.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string | null;
  className?: string;
}) {
  return (
    <header className={cn('mb-9 border-b border-line pb-7', className)}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="section-title text-[clamp(1.9rem,4vw,3rem)]">{title}</h1>
      {intro ? <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-muted">{intro}</p> : null}
    </header>
  );
}

export function ContentPending({ title, channel }: { title: string; channel?: string }) {
  return (
    <div className="max-w-2xl border border-dashed border-line bg-surface/60 px-6 py-10">
      <p className="text-sm font-semibold">{title} has not been published yet.</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Our team can walk you through the details personally{channel ? ` on ${channel}` : ''} — reach out any time.
      </p>
    </div>
  );
}
