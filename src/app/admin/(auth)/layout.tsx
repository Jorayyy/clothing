import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/guard';

export const metadata = { title: 'Sign in' };

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">MicsApparel</p>
          <h1 className="font-display text-3xl">Admin</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
