'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { IconChevronDown, IconMenu, IconMessenger, IconSearch } from '@/components/ui/icons';
import type { ResolvedNavGroup } from '@/lib/queries/content';
import { cn } from '@/lib/utils';

import { MobileNav } from './mobile-nav';

interface HeaderProps {
  groups: ResolvedNavGroup[];
  wordmark: string;
  logoUrl?: string | null;
  layout: 'centered' | 'split' | 'minimal';
  messengerHref: string | null;
  messengerLabel: string;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  const [path] = href.split('?');
  return pathname === path || pathname.startsWith(`${path}/`);
}

function SearchMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = q.trim();
    setOpen(false);
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Search products"
        aria-expanded={open}
        className="rounded-full p-2.5 text-ink transition-colors hover:text-accent"
      >
        <IconSearch size={19} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 -z-10" aria-hidden="true" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            role="search"
            className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] border border-line bg-surface p-3 shadow-xl"
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <IconSearch size={16} />
              </span>
              <input
                autoFocus
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search products"
                className="input w-full pl-9"
              />
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}

export function Header({ groups, wordmark, logoUrl, layout, messengerHref, messengerLabel }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const brand = (
    <Link href="/" className="group inline-flex items-center" aria-label={`${wordmark} — home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={wordmark} width={150} height={44} className="h-9 w-auto object-contain" />
      ) : (
        <span className="font-display text-[1.3rem] uppercase leading-none tracking-[0.24em] transition-colors group-hover:text-accent">
          {wordmark}
        </span>
      )}
    </Link>
  );

  const burger = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="Open menu"
      aria-expanded={menuOpen}
      className="-ml-2 rounded-full p-2 text-ink transition-colors hover:text-accent lg:hidden"
    >
      <IconMenu size={20} />
    </button>
  );

  const nav = (
    <nav aria-label="Primary" className={cn(layout === 'centered' && 'flex justify-center')}>
      <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-1">
        {groups.map((group) => {
          const hasChildren = Boolean(group.children?.length);
          const active = isActive(pathname, group.href);
          return (
            <li key={group.id} className="group relative">
              <Link
                href={group.href}
                target={group.openInNewTab ? '_blank' : undefined}
                rel={group.openInNewTab ? 'noreferrer noopener' : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative inline-flex items-center gap-1 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors',
                  active ? 'text-accent' : 'text-ink hover:text-accent',
                )}
              >
                {group.label}
                {hasChildren ? <IconChevronDown size={12} className="mt-px opacity-60" /> : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300',
                    'group-hover:w-full group-focus-within:w-full',
                    active && 'w-full',
                  )}
                />
              </Link>

              {hasChildren ? (
                <div className="invisible absolute left-0 top-full z-30 min-w-52 translate-y-1 border border-line bg-surface py-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {group.children?.map((child) => (
                    <Link
                      key={`${child.href}-${child.label}`}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-bg hover:text-accent"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const actions = (
    <div className="flex items-center justify-end gap-1">
      <SearchMenu />
      {messengerHref ? (
        <a
          href={messengerHref}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-accent btn-sm ml-1 hidden sm:inline-flex"
        >
          <IconMessenger size={15} />
          {messengerLabel}
        </a>
      ) : null}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--site-bg)_90%,transparent)] backdrop-blur-md">
        <div className="container-site py-3.5">
          {layout === 'split' ? (
            <div className="grid grid-cols-[1fr_auto] items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <div className="flex items-center gap-3">
                {burger}
                {brand}
              </div>
              <div className="hidden lg:block">{nav}</div>
              <div className="hidden justify-self-end lg:flex">{actions}</div>
              <div className="flex items-center gap-1 justify-self-end lg:hidden">
                <SearchMenu />
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  className="-mr-2 rounded-full p-2.5 text-ink transition-colors hover:text-accent lg:hidden"
                >
                  <IconMenu size={20} />
                </button>
              </div>
            </div>
          ) : layout === 'centered' ? (
            <div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center lg:invisible">{burger}</div>
                <div>{brand}</div>
                <div className="flex items-center">{actions}</div>
              </div>
              <div className="mt-2 hidden lg:block">{nav}</div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-5">
                {burger}
                {brand}
                <div className="hidden lg:block">{nav}</div>
              </div>
              <div className="hidden lg:flex">{actions}</div>
            </div>
          )}
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} groups={groups} />
    </>
  );
}
