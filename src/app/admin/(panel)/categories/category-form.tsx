'use client';

import { useActionState, useState } from 'react';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';
import { slugify } from '@/lib/utils';

import { deleteCategoryAction, saveCategoryAction } from './actions';

interface CategoryInitial {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  position: number;
  imageId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export function CategoryForm({
  category,
  mediaOptions,
}: {
  category?: CategoryInitial;
  mediaOptions: MediaOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveCategoryAction, {});
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [imageId, setImageId] = useState<string[]>(category?.imageId ? [category.imageId] : []);
  const [confirming, setConfirming] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>({});

  const remove = async () => {
    if (!category) return;
    const result = await deleteCategoryAction(category.id);
    setConfirming(false);
    if (result.error) setDeleteState(result);
    else setDeleteState({ ok: true, message: 'Category deleted.' });
  };

  return (
    <form action={formAction} className="space-y-4">
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}
      <input type="hidden" name="imageId" value={imageId[0] ?? ''} />

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">
            Name <span className="text-accent">*</span>
          </span>
          <input
            className="input"
            name="name"
            value={name}
            required
            onChange={(event) => {
              setName(event.target.value);
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

      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          className="input"
          name="description"
          rows={2}
          defaultValue={category?.description ?? ''}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input appearance-none"
            name="status"
            defaultValue={category?.status ?? 'published'}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Position</span>
          <input
            className="input"
            name="position"
            type="number"
            min={0}
            defaultValue={category?.position ?? 0}
          />
        </label>
        <label className="field">
          <span className="field-label">Meta title</span>
          <input className="input" name="seoTitle" defaultValue={category?.seoTitle ?? ''} />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Meta description</span>
        <input
          className="input"
          name="seoDescription"
          defaultValue={category?.seoDescription ?? ''}
        />
      </label>

      <MediaPicker
        options={mediaOptions}
        value={imageId}
        onChange={(ids) => setImageId(ids.slice(0, 1))}
        label="Cover image"
        hint="Pick one image from the library."
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </Button>
        {category ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost btn-sm text-sale"
          >
            Delete
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${category?.name}?`}
        body="Products keep existing, but they lose their link to this category."
        confirmLabel="Delete"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </form>
  );
}
