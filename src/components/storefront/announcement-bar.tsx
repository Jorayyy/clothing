import Link from 'next/link';

import type { StoreSettings } from '@/lib/settings/schema';

export function AnnouncementBar({ announcement }: { announcement: StoreSettings['announcement'] }) {
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const content = (
    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
      {announcement.text}
      {announcement.linkLabel && announcement.linkHref ? (
        <span className="ml-3 underline decoration-from-font underline-offset-4">{announcement.linkLabel}</span>
      ) : null}
    </span>
  );

  return (
    <div className="bg-primary text-on-primary">
      <div className="container-site flex min-h-9 items-center justify-center py-2 text-center">
        {announcement.linkHref ? (
          <Link
            href={announcement.linkHref}
            className="transition-opacity hover:opacity-80"
            aria-label={`${announcement.text} — ${announcement.linkLabel || 'learn more'}`}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
