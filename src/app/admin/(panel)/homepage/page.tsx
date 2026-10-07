import { asc } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { homeSections } from '@/lib/db/schema';
import { SECTION_DEFINITIONS, getSectionDefinition } from '@/lib/home-sections';
import { listMedia } from '@/lib/queries/admin-media';

import { AddSectionForm } from './add-section';
import { SectionRow } from './section-row';

export const metadata = { title: 'Homepage' };

export default async function HomepageAdminPage() {
  const db = await getDb();

  const [rows, mediaOptions] = await Promise.all([
    db.select().from(homeSections).orderBy(asc(homeSections.position), asc(homeSections.createdAt)),
    listMedia(),
  ]);

  const media = mediaOptions.map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt,
    fileName: row.fileName,
  }));

  const usedTypes = new Set(rows.map((row) => row.type));
  const options = SECTION_DEFINITIONS.filter(
    (definition) => definition.type !== 'hero' || !usedTypes.has('hero'),
  ).map((definition) => ({ value: definition.type, label: definition.label }));

  return (
    <>
      <AdminPageHeader
        title="Homepage"
        description="Sections render top to bottom. Drag-free ordering: use the arrows, then save."
      />

      <div className="mb-6">
        <AddSectionForm options={options} nextPosition={rows.length} />
      </div>

      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
            No sections yet — the storefront falls back to a default layout until you add some.
          </li>
        ) : null}

        {rows.map((row, index) => {
          const definition = getSectionDefinition(row.type);
          return (
            <SectionRow
              key={row.id}
              section={{
                id: row.id,
                type: row.type,
                title: row.title,
                enabled: row.enabled,
                position: row.position,
                config: (row.config ?? {}) as Record<string, unknown>,
              }}
              label={definition?.label ?? row.type}
              description={definition?.description ?? 'Custom section.'}
              mediaOptions={media}
              canMoveUp={index > 0}
              canMoveDown={index < rows.length - 1}
            />
          );
        })}
      </ul>
    </>
  );
}
