'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';
import { buildVariantCombos, type AttributeInput } from '@/lib/admin/variants';

import { saveProductAction } from './actions';

interface CategoryOption {
  id: string;
  name: string;
}

interface AttributeState {
  id: string;
  key: string;
  name: string;
  /** comma-separated while editing */
  values: string;
}

interface ProductInitial {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  salePrice: number | null;
  compareAtPrice: number | null;
  label: string;
  sku: string | null;
  trackStock: boolean;
  stockQuantity: number;
  material: string | null;
  fit: string | null;
  measurements: string | null;
  care: string | null;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  imageIds: string[];
  attributes: { key: string; name: string; values: string[] }[];
}

const OPTION_KEYS = ['size', 'color', 'style', 'material', 'length'];

function splitValues(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function toPesos(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return '';
  return (centavos / 100).toFixed(centavos % 100 === 0 ? 0 : 2);
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export function ProductForm({
  product,
  mediaOptions,
  categories,
  categoryIds,
}: {
  product?: ProductInitial;
  mediaOptions: MediaOption[];
  categories: CategoryOption[];
  categoryIds: string[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveProductAction, {});

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [imageIds, setImageIds] = useState<string[]>(product?.imageIds ?? []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(categoryIds);
  const [attributes, setAttributes] = useState<AttributeState[]>(
    product
      ? product.attributes.map((attribute, index) => ({
          id: `attr-${index}`,
          key: attribute.key,
          name: attribute.name,
          values: attribute.values.join(', '),
        }))
      : [
          {
            id: 'attr-0',
            key: 'size',
            name: 'Size',
            values: '',
          },
        ],
  );

  const attributePayload: AttributeInput[] = useMemo(
    () =>
      attributes
        .filter((attribute) => attribute.name.trim() && splitValues(attribute.values).length > 0)
        .map((attribute) => ({
          key: attribute.key || 'option',
          name: attribute.name.trim(),
          values: splitValues(attribute.values),
        })),
    [attributes],
  );

  const combos = useMemo(() => buildVariantCombos(attributePayload), [attributePayload]);
  const hasOverflow =
    attributePayload.length > 0 && combos.length === 0;

  const updateAttribute = (id: string, patch: Partial<AttributeState>) => {
    setAttributes((current) =>
      current.map((attribute) => (attribute.id === id ? { ...attribute, ...patch } : attribute)),
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <input type="hidden" name="imageIds" value={JSON.stringify(imageIds)} />
      <input type="hidden" name="categoryIds" value={JSON.stringify(selectedCategoryIds)} />
      <input type="hidden" name="attributes" value={JSON.stringify(attributePayload)} />

      {state.error ? (
        <p role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">Details</h2>

          <label className="field">
            <span className="field-label">
              Name <span className="text-accent">*</span>
            </span>
            <input
              className="input"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugTouched) setSlug(toSlug(event.target.value));
              }}
              required
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
                setSlug(toSlug(event.target.value));
              }}
              placeholder="auto-generated-from-name"
            />
            <span className="mt-1 block text-xs text-muted">
              Lowercase letters, numbers and hyphens. Leave blank to derive it from the name.
            </span>
          </label>

          <label className="field">
            <span className="field-label">Short summary</span>
            <textarea
              className="input"
              name="summary"
              rows={2}
              maxLength={300}
              defaultValue={product?.summary ?? ''}
            />
          </label>

          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              className="input"
              name="description"
              rows={7}
              defaultValue={product?.description ?? ''}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Material</span>
              <input className="input" name="material" defaultValue={product?.material ?? ''} />
            </label>
            <label className="field">
              <span className="field-label">Fit</span>
              <input className="input" name="fit" defaultValue={product?.fit ?? ''} />
            </label>
            <label className="field">
              <span className="field-label">Measurements</span>
              <input
                className="input"
                name="measurements"
                defaultValue={product?.measurements ?? ''}
              />
            </label>
            <label className="field">
              <span className="field-label">Care</span>
              <input className="input" name="care" defaultValue={product?.care ?? ''} />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Video URL</span>
            <input
              className="input"
              name="videoUrl"
              type="url"
              defaultValue={product?.videoUrl ?? ''}
              placeholder="https://…"
            />
          </label>
        </section>

        <aside className="space-y-4 border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">Publishing</h2>

          <label className="field">
            <span className="field-label">Status</span>
            <select className="input appearance-none" name="status" defaultValue={product?.status ?? 'draft'}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Label</span>
            <input
              className="input"
              name="label"
              defaultValue={product?.label ?? ''}
              placeholder="New, Limited, Sale"
            />
            <span className="mt-1 block text-xs text-muted">Space-separated badges shown on cards.</span>
          </label>

          <label className="field">
            <span className="field-label">SKU</span>
            <input className="input" name="sku" defaultValue={product?.sku ?? ''} />
          </label>

          <fieldset className="space-y-3 border-t border-line pt-4">
            <legend className="sr-only">Collection flags</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                value="1"
                defaultChecked={product?.featured ?? false}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isNewArrival"
                value="1"
                defaultChecked={product?.isNewArrival ?? false}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              New arrival
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isBestSeller"
                value="1"
                defaultChecked={product?.isBestSeller ?? false}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Best seller
            </label>
          </fieldset>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field">
              <span className="field-label">
                Price (₱) <span className="text-accent">*</span>
              </span>
              <input
                className="input"
                name="price"
                inputMode="decimal"
                defaultValue={toPesos(product?.price)}
                placeholder="699"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Sale price (₱)</span>
              <input
                className="input"
                name="salePrice"
                inputMode="decimal"
                defaultValue={toPesos(product?.salePrice)}
                placeholder="—"
              />
            </label>
            <label className="field">
              <span className="field-label">Compare at (₱)</span>
              <input
                className="input"
                name="compareAtPrice"
                inputMode="decimal"
                defaultValue={toPesos(product?.compareAtPrice)}
                placeholder="—"
              />
            </label>
          </div>

          <div className="grid items-end gap-4 border-t border-line pt-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="trackStock"
                value="1"
                defaultChecked={product?.trackStock ?? false}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Track stock
            </label>
            <label className="field">
              <span className="field-label">Stock quantity</span>
              <input
                className="input"
                name="stockQuantity"
                type="number"
                min={0}
                defaultValue={product?.stockQuantity ?? 0}
              />
            </label>
            <p className="text-xs leading-relaxed text-muted">
              Stock is tracked at product level. Option combinations below are for selection, not
              separate inventory.
            </p>
          </div>
        </section>

        <aside className="space-y-4 border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">SEO</h2>
          <label className="field">
            <span className="field-label">Meta title</span>
            <input className="input" name="seoTitle" defaultValue={product?.seoTitle ?? ''} />
          </label>
          <label className="field">
            <span className="field-label">Meta description</span>
            <textarea
              className="input"
              name="seoDescription"
              rows={3}
              defaultValue={product?.seoDescription ?? ''}
            />
          </label>
        </aside>
      </div>

      <section className="border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted">Options</h2>

        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="grid gap-3 border border-line p-3 sm:grid-cols-12">
              <label className="field sm:col-span-3">
                <span className="field-label">Option key</span>
                <select
                  className="input appearance-none"
                  value={attribute.key}
                  onChange={(event) => updateAttribute(attribute.id, { key: event.target.value })}
                >
                  {OPTION_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field sm:col-span-3">
                <span className="field-label">Label</span>
                <input
                  className="input"
                  value={attribute.name}
                  onChange={(event) => updateAttribute(attribute.id, { name: event.target.value })}
                  placeholder="Size"
                />
              </label>
              <label className="field sm:col-span-5">
                <span className="field-label">Values</span>
                <input
                  className="input"
                  value={attribute.values}
                  onChange={(event) => updateAttribute(attribute.id, { values: event.target.value })}
                  placeholder="S, M, L, XL"
                />
              </label>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() =>
                    setAttributes((current) => current.filter((row) => row.id !== attribute.id))
                  }
                  className="btn btn-ghost btn-sm text-sale"
                  aria-label={`Remove ${attribute.name || 'option'}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setAttributes((current) => [
                ...current,
                {
                  id: `attr-${Date.now()}`,
                  key: 'color',
                  name: 'Colour',
                  values: '',
                },
              ])
            }
            className="btn btn-outline btn-sm"
          >
            Add option
          </button>
          <span className="text-xs text-muted">
            Combinations update automatically as you type.
          </span>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          {attributePayload.length === 0 ? (
            <p className="text-sm text-muted">No options yet — this product sells as a single SKU.</p>
          ) : hasOverflow ? (
            <p className="text-sm text-red-700">
              That produces more than 96 combinations. Remove a value or split the product.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium">
                {combos.length} variant{combos.length === 1 ? '' : 's'} will be generated
              </p>
              <ul className="flex flex-wrap gap-2">
                {combos.map((combo) => (
                  <li key={combo.name} className="tag tag-outline">
                    {combo.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted">Media</h2>
          <MediaPicker
            options={mediaOptions}
            value={imageIds}
            onChange={setImageIds}
            hint="The first image is used as the cover everywhere."
          />
        </section>

        <section className="border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">No categories yet — create one first.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="h-4 w-4 accent-[var(--site-accent)]"
                    />
                    {category.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </Button>
        <Link href="/admin/products" className="btn btn-ghost">
          Back to products
        </Link>
        {state.ok && product ? (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            View on site ↗
          </Link>
        ) : null}
      </div>
    </form>
  );
}
