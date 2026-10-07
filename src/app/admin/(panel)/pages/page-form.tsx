'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import type { MediaOption } from '@/components/admin/media-library';
import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';
import type { RichBlock } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';

import { BlockEditor } from './block-editor';
import { deletePageAction, savePageAction } from './actions';

interface PageInitial {
  id: string;
  title: string;
  slug: string;
  content: RichBlock[];
  status: 'draft' | 'published';
  showInFooter: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export function PageForm({ page, mediaOptions }: { page?: PageInitial; mediaOptions: MediaOption[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePageAction, {});
  const [title, setTitle] = useState(page?.title ?? '');
  const [slug, setSlug] = useState(page?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(page));
  const [blocks, setBlocks] = useState<RichBlock[]>(page?.content ?? []);
  const [confirming, setConfirming] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>({});

  const remove = async () => {
    if (!page) return;
    const result = await deletePageAction(page.id);
    setConfirming(false);
    if (result.error) setDeleteState(result);
    else setDeleteState({ ok: true, message: 'Page deleted.' });
  };

  return (
    <form action={formAction} className="space-y-5">
      {page ? <input type="hidden" name="pageId" value={page.id} /> : null}
      <input type="hidden" name="content" value={JSON.stringify(blocks)} />

      {state.error ? (
        <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      {deleteState.error ? (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {deleteState.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field sm:col-span-2">
          <span className="field-label">
            Title <span className="text-accent">*</span>
          </span>
          <input
            className="input"
            name="title"
            value={title}
            required
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
        </label>
        <label className="field">
          <span className="field-label">URL handle</span>
          <input
            className="input"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input appearance-none"
            name="status"
            defaultValue={page?.status ?? 'draft'}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="showInFooter"
            value="1"
            defaultChecked={page?.showInFooter ?? false}
            className="h-4 w-4 accent-[var(--site-accent)]"
          />
          Show in footer
        </label>
        <label className="field">
          <span className="field-label">Meta title</span>
          <input className="input" name="seoTitle" defaultValue={page?.seoTitle ?? ''} />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Meta description</span>
        <input
          className="input"
          name="seoDescription"
          defaultValue={page?.seoDescription ?? ''}
        />
      </label>

      <section className="border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted">Content</h2>
        <BlockEditor value={blocks} onChange={setBlocks} mediaOptions={mediaOptions} />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : page ? 'Save changes' : 'Create page'}
        </Button>
        {page ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost btn-sm text-sale"
          >
            Delete
          </button>
        ) : null}
        {page && page.status === 'published' ? (
          <Link
            href={`/pages/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
          >
            View ↗
          </Link>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${page?.title}?`}
        body="The page and its content are removed permanently."
        confirmLabel="Delete"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </form>
  );
}
