'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';

import { formatPrice } from '@/lib/format';

export interface RecentlyViewedItem {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

const STORAGE_KEY = 'mics:recently-viewed';
const CHANGE_EVENT = 'mics:recently-viewed-change';
const MAX_ITEMS = 8;

let cached: RecentlyViewedItem[] | null = null;

function readStore(): RecentlyViewedItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentlyViewedItem =>
        Boolean(item) && typeof (item as RecentlyViewedItem).slug === 'string',
    );
  } catch {
    return [];
  }
}

function commit(items: RecentlyViewedItem[]): void {
  cached = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* storage unavailable — keep the in-memory snapshot */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => {
    cached = null;
    onStoreChange();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(): RecentlyViewedItem[] {
  if (cached === null) cached = readStore();
  return cached;
}

function getServerSnapshot(): RecentlyViewedItem[] {
  return EMPTY;
}

const EMPTY: RecentlyViewedItem[] = [];

/**
 * Stores the current product in localStorage (client only, never sent to the
 * server) and lists the other recently viewed items.
 */
export function RecentlyViewed({ current }: { current: RecentlyViewedItem }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const existing = readStore();
    const next = [current, ...existing.filter((item) => item.slug !== current.slug)].slice(0, MAX_ITEMS);
    commit(next);
  }, [current]);

  const others = items.filter((item) => item.slug !== current.slug).slice(0, 4);
  if (others.length === 0) return null;

  return (
    <section className="container-site py-14 sm:py-16">
      <h2 className="section-title mb-6 text-[clamp(1.4rem,2.5vw,2rem)]">Recently viewed</h2>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
        {others.map((item) => (
          <Link key={item.slug} href={`/products/${item.slug}`} className="group">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
            </div>
            <p className="mt-3 truncate text-sm font-medium transition-colors group-hover:text-accent">
              {item.name}
            </p>
            <p className="mt-0.5 text-sm text-muted tabular-nums">{formatPrice(item.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
