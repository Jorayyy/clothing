'use client';

import Image from 'next/image';
import { useActionState, useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import type { ActionState } from '@/lib/admin/action-state';
import { formatBytes, formatDateTime } from '@/lib/format';

import { deleteMediaAction, updateMediaAction, uploadMediaAction } from './actions';

export interface MediaItem {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: Date;
}

function AltEditor({ item }: { item: MediaItem }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateMediaAction, {});
  const [alt, setAlt] = useState(item.alt);

  return (
    <form action={formAction} className="mt-2 space-y-1.5">
      <input type="hidden" name="mediaId" value={item.id} />
      <input
        className="input text-xs"
        name="alt"
        value={alt}
        onChange={(event) => setAlt(event.target.value)}
        placeholder="Alt text"
        aria-label={`Alt text for ${item.fileName}`}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || alt === item.alt}
          className="btn btn-outline btn-sm"
        >
          {pending ? 'Saving…' : 'Save alt'}
        </button>
        {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
        {state.ok ? <span className="text-xs text-emerald-700">Saved</span> : null}
      </div>
    </form>
  );
}

export function MediaManager({ items }: { items: MediaItem[] }) {
  const [uploadState, uploadAction, uploadPending] = useActionState<ActionState, FormData>(
    uploadMediaAction,
    {},
  );
  const [confirming, setConfirming] = useState<MediaItem | null>(null);
  const [deleteState, setDeleteState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    if (!confirming) return;
    const id = confirming.id;
    startTransition(async () => {
      const result = await deleteMediaAction(id);
      setConfirming(null);
      if (result.error) setDeleteState(result);
      else setDeleteState({});
    });
  };

  return (
    <div className="space-y-6">
      <form
        action={uploadAction}
        className="space-y-4 border border-line bg-surface p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">Upload</h2>

        {uploadState.error ? (
          <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {uploadState.error}
          </p>
        ) : null}
        {uploadState.ok ? (
          <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Uploaded.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">
              File <span className="text-accent">*</span>
            </span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              required
              className="input"
            />
            <span className="mt-1 block text-xs text-muted">
              JPEG, PNG, WebP, GIF or AVIF — up to 6MB.
            </span>
          </label>
          <label className="field">
            <span className="field-label">Alt text</span>
            <input
              className="input"
              name="alt"
              placeholder="Describe the image for screen readers"
            />
          </label>
        </div>

        <Button type="submit" variant="primary" size="sm" disabled={uploadPending}>
          {uploadPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size={14} /> Uploading…
            </span>
          ) : (
            'Upload image'
          )}
        </Button>
      </form>

      {deleteState.error ? (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {deleteState.error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="border border-line bg-surface px-5 py-10 text-center text-sm text-muted">
          The media library is empty. Upload your first image above.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="border border-line bg-surface p-3">
              <div className="relative aspect-square w-full overflow-hidden border border-line bg-bg">
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>

              <p className="mt-2 truncate text-xs font-medium" title={item.fileName}>
                {item.fileName}
              </p>
              <p className="text-[0.68rem] text-muted">
                {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                {formatBytes(item.byteSize)} · {formatDateTime(item.createdAt)}
              </p>

              <AltEditor item={item} />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => setConfirming(item)}
                  disabled={isPending}
                  className="btn btn-ghost btn-sm text-sale"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this image?"
        body={
          confirming
            ? `${confirming.fileName} is removed from storage. Products referencing it lose that image.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        busy={isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={remove}
      />
    </div>
  );
}
