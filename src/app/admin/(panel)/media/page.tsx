import { AdminPageHeader } from '@/components/admin/page-header';
import { listMedia } from '@/lib/queries/admin-media';

import { MediaManager } from './media-manager';

export const metadata = { title: 'Media' };

export default async function MediaPage() {
  const items = await listMedia(500);

  return (
    <>
      <AdminPageHeader
        title="Media library"
        description="Uploads are stored in your configured storage — Vercel Blob in production, local disk in development."
      />
      <MediaManager items={items} />
    </>
  );
}
