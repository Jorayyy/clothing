import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/misc';
import { getPublicCollections } from '@/lib/queries/catalog';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Curated edits from MicsApparel.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const collections = await getPublicCollections();

  return (
    <div className="container-site py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-5 text-xs uppercase tracking-[0.16em] text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">Collections</li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-line pb-6">
        <h1 className="section-title text-[clamp(1.9rem,4vw,3rem)]">Collections</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Edits we put together around a mood, a season or a drop.
        </p>
      </header>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections published yet"
          description="Collections will appear here as soon as they are published from the admin."
          action={
            <Link href="/shop" className="btn btn-primary">
              Browse the shop
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group relative isolate flex aspect-[4/5] items-end overflow-hidden bg-surface"
            >
              {collection.coverImage ? (
                <Image
                  src={collection.coverImage.url}
                  alt={collection.coverImage.alt || collection.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent/60" />
              )}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="relative z-10 w-full p-5 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl leading-tight">{collection.name}</h2>
                    {collection.description ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{collection.description}</p>
                    ) : null}
                  </div>
                  <IconArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </div>
                <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/70">
                  {collection.productCount ?? 0} pieces
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
