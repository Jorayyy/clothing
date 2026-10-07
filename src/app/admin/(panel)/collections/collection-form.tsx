'use client';

import { useActionState, useMemo, useState } from 'react';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';
import { slugify } from '@/lib/utils';

import { deleteCollectionAction, saveCollectionAction } from './actions';

interface ProductOption {
  id: string;
  name: string;
}

interface CollectionInitial {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  selectionMode: 'manual' | 'rules';
  isFeatured: boolean;
  position: number;
  coverImageId: string | null;
}

export function CollectionForm({
  collection,
  productIds,
  products,
  mediaOptions,
}: {
  collection?: CollectionInitial;
  productIds: string[];
  products: ProductOption[];
  mediaOptions: MediaOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveCollectionAction,
    {},
  );
  const [name, setName] = useState(collection?.name ?? '');
  const [slug, setSlug] = useState(collection?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(collection));
  const [coverId, setCoverId] = useState<string[]>(collection?.coverImageId ? [collection.coverImageId] : []);
  const [selected, setSelected] = useState<string[]>(productIds);
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) => product.name.toLowerCase().includes(needle));
  }, [products, query]);

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const remove = async () => {
    if (!collection) return;
    const result = await deleteCollectionAction(collection.id);
    setConfirming(false);
    if (result.error) setDeleteState(result);
    else setDeleteState({ ok: true, message: 'Collection deleted.' });
  };

  return (
    <form action={formAction} className="space-y-4">
      {collection ? <input type="hidden" name="collectionId" value={collection.id} /> : null}
      <input type="hidden" name="coverImageId" value={coverId[0] ?? ''} />
      <input type="hidden" name="productIds" value={JSON.stringify(selected)} />

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
          defaultValue={collection?.description ?? ''}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input appearance-none"
            name="status"
            defaultValue={collection?.status ?? 'published'}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Selection</span>
          <select
            className="input appearance-none"
            name="selectionMode"
            defaultValue={collection?.selectionMode ?? 'manual'}
          >
            <option value="manual">Manual</option>
            <option value="rules">Rules</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Position</span>
          <input
            className="input"
            name="position"
            type="number"
            min={0}
            defaultValue={collection?.position ?? 0}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            value="1"
            defaultChecked={collection?.isFeatured ?? false}
            className="h-4 w-4 accent-[var(--site-accent)]"
          />
          Featured
        </label>
      </div>

      <MediaPicker
        options={mediaOptions}
        value={coverId}
        onChange={(ids) => setCoverId(ids.slice(0, 1))}
        label="Cover image"
      />

      <div className="field">
        <span className="field-label">
          Products <span className="text-muted">({selected.length} selected)</span>
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter products"
          className="input mb-2"
        />
        <ul className="max-h-56 divide-y divide-line overflow-y-auto border border-line bg-bg">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">No products match.</li>
          ) : (
            filtered.map((product) => (
              <li key={product.id}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggle(product.id)}
                    className="h-4 w-4 accent-[var(--site-accent)]"
                  />
                  {product.name}
                </label>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : collection ? 'Save changes' : 'Create collection'}
        </Button>
        {collection ? (
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
        title={`Delete ${collection?.name}?`}
        body="The collection is removed. Its products stay in the catalogue."
        confirmLabel="Delete"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </form>
  );
}
