import { asc } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { navigationItems } from '@/lib/db/schema';

import { NavItemRow, NewNavItemForm, type NavItemInitial } from './nav-item-row';

export const metadata = { title: 'Navigation' };

const MENUS: { menu: 'header' | 'footer' | 'mobile'; title: string; description: string }[] = [
  { menu: 'header', title: 'Header menu', description: 'Desktop and tablet top navigation.' },
  { menu: 'footer', title: 'Footer menu', description: 'Links repeated in the footer.' },
  { menu: 'mobile', title: 'Mobile menu', description: 'Overrides the header menu on phones when set.' },
];

export default async function NavigationPage() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(navigationItems)
    .orderBy(asc(navigationItems.menu), asc(navigationItems.position), asc(navigationItems.createdAt));

  return (
    <>
      <AdminPageHeader
        title="Navigation"
        description="Header, footer and mobile menus. A menu with no saved items falls back to sensible defaults."
      />

      <div className="space-y-8">
        {MENUS.map(({ menu, title, description }) => {
          const items = rows
            .filter((row) => row.menu === menu)
            .map((row) => ({
              id: row.id,
              menu: row.menu,
              label: row.label,
              href: row.href,
              kind: row.kind,
              position: row.position,
              enabled: row.enabled,
              openInNewTab: row.openInNewTab,
            })) as NavItemInitial[];

          return (
            <section key={menu} className="border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="mt-0.5 text-sm text-muted">{description}</p>
              </div>

              <div className="space-y-3 p-5">
                <NewNavItemForm menu={menu} />

                {items.length === 0 ? (
                  <p className="border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                    No custom items — the built-in defaults are showing on the site.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item, index) => (
                      <NavItemRow
                        key={item.id}
                        item={item}
                        canMoveUp={index > 0}
                        canMoveDown={index < items.length - 1}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
