'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOutAction } from '@/app/admin/(auth)/actions';
import {
  IconAlert,
  IconCopy,
  IconEdit,
  IconEye,
  IconGrid,
  IconImage,
  IconLayers,
  IconLogout,
  IconMenu,
  IconMessenger,
  IconPackage,
  IconSettings,
  IconUser,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type IconComponent = ComponentType<{ size?: number }>;

interface NavItem {
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: IconGrid, exact: true }],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: IconPackage },
      { href: '/admin/categories', label: 'Categories', icon: IconLayers },
      { href: '/admin/collections', label: 'Collections', icon: IconGrid },
      { href: '/admin/media', label: 'Media', icon: IconImage },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: IconEdit },
      { href: '/admin/navigation', label: 'Navigation', icon: IconMenu },
      { href: '/admin/homepage', label: 'Homepage', icon: IconEye },
    ],
  },
  {
    label: 'Audience',
    items: [
      { href: '/admin/inquiries', label: 'Inquiries', icon: IconMessenger },
      { href: '/admin/newsletter', label: 'Newsletter', icon: IconCopy },
    ],
  },
  {
    label: 'Store',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: IconSettings },
      { href: '/admin/users', label: 'Users', icon: IconUser },
      { href: '/admin/audit', label: 'Audit log', icon: IconAlert },
    ],
  },
];

export interface SidebarUser {
  name: string;
  email: string;
  role: string;
}

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <div className="shrink-0 border-b border-line bg-ink text-on-primary lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block">
        <div className="min-w-0">
          <Link href="/admin" className="font-display text-xl leading-none">
            MicsApparel
          </Link>
          <p className="mt-1 truncate text-xs text-on-primary/60">Store administration</p>
        </div>

        <div className="hidden lg:mt-6 lg:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs capitalize text-on-primary/60">{user.role}</p>
        </div>

        <form action={signOutAction} className="lg:hidden">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-white/20 px-2.5 py-1.5 text-xs text-on-primary/80 hover:border-white/40"
          >
            <IconLogout size={14} />
            Sign out
          </button>
        </form>
      </div>

      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-t border-white/10 px-2 py-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t-0 lg:px-3 lg:py-4">
        {GROUPS.map((group) => (
          <div key={group.label} className="contents lg:block">
            <p className="hidden px-3 pb-1 pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-on-primary/45 lg:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-btn)] px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-white/12 text-white'
                      : 'text-on-primary/70 hover:bg-white/6 hover:text-white',
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-white/10 px-3 py-4 lg:block">
        <p className="truncate text-xs text-on-primary/50">{user.email}</p>
        <form action={signOutAction} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/20 px-3 py-1.5 text-xs text-on-primary/80 hover:border-white/40 hover:text-white"
          >
            <IconLogout size={14} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
