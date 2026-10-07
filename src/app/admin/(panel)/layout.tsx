import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/guard';

import { Sidebar } from './sidebar';

export const metadata = { title: { template: '%s · Admin', default: 'Admin' } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="lg:flex">
        <Sidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3">
            <p className="truncate text-sm text-muted">MicsApparel storefront</p>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
            >
              View site ↗
            </Link>
          </header>

          <main id="admin-main" className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
