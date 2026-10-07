'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { IconChevronDown, IconClose, IconSearch } from '@/components/ui/icons';
import type { ResolvedNavGroup } from '@/lib/queries/content';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  groups: ResolvedNavGroup[];
}

export function MobileNav({ open, onClose, groups }: MobileNavProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a, button')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) onClose();
    // Close whenever the route changes so the drawer never lingers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-surface outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-display text-lg uppercase tracking-[0.2em]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-m-2 rounded-full p-2 text-muted hover:text-ink"
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-1">
            {groups.map((group) => {
              const hasChildren = Boolean(group.children?.length);
              const isExpanded = expanded === group.id;
              return (
                <li key={group.id} className="border-b border-line/70">
                  <div className="flex items-center">
                    <Link
                      href={group.href}
                      onClick={onClose}
                      className="flex-1 py-3.5 text-[0.95rem] font-medium uppercase tracking-[0.12em]"
                    >
                      {group.label}
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`Toggle ${group.label} submenu`}
                        onClick={() => setExpanded(isExpanded ? null : group.id)}
                        className="rounded-full p-2 text-muted hover:text-ink"
                      >
                        <IconChevronDown
                          size={16}
                          className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isExpanded ? (
                    <ul className="mb-3 ml-1 space-y-1 border-l border-line pl-4">
                      {group.children?.map((child) => (
                        <li key={child.href + child.label}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className="block py-2 text-sm text-muted hover:text-accent"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <Link
            href="/search"
            onClick={onClose}
            className="mt-6 flex w-full items-center gap-2 border border-line px-4 py-3 text-sm text-muted hover:border-ink hover:text-ink"
          >
            <IconSearch size={16} />
            Search products
          </Link>
        </nav>
      </div>
    </div>
  );
}
