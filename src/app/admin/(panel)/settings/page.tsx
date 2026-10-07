import { AdminPageHeader } from '@/components/admin/page-header';
import { getSettings } from '@/lib/settings';
import { listMedia } from '@/lib/queries/admin-media';

import { SettingsForm } from './settings-form';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const [settings, mediaOptions] = await Promise.all([getSettings(), listMedia()]);

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Everything the storefront reads at request time — no redeploy needed."
      />
      <SettingsForm
        settings={settings}
        mediaOptions={mediaOptions.map((row) => ({
          id: row.id,
          url: row.url,
          alt: row.alt,
          fileName: row.fileName,
        }))}
      />
    </>
  );
}
