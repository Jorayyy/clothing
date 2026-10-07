'use client';

import { useMemo, useState } from 'react';

import { InquiryButton } from '@/components/storefront/inquiry-button';
import { formatPrice } from '@/lib/format';
import { buildInquiryLink } from '@/lib/inquiry';
import type { VariantData } from '@/lib/queries/products';
import type { ContactSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

interface VariantPickerProps {
  attributes: { id: string; key: string; name: string; values: string[] }[];
  variants: VariantData[];
  basePrice: number;
  baseCompareAt: number | null;
  productName: string;
  productSlug: string;
  contact: ContactSettings;
  siteUrl: string;
}

export function VariantPicker({
  attributes,
  variants,
  basePrice,
  baseCompareAt,
  productName,
  productSlug,
  contact,
  siteUrl,
}: VariantPickerProps) {
  const usableAttributes = attributes.filter((attribute) => attribute.values.length > 0);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const firstVariant = variants[0];
    if (firstVariant) {
      for (const attribute of usableAttributes) {
        const value = firstVariant.options[attribute.key];
        if (value) initial[attribute.key] = value;
      }
    }
    return initial;
  });

  const variant = useMemo(() => {
    if (!variants.length) return null;
    const chosen = Object.entries(selected).filter(([, value]) => value);
    if (chosen.length === 0) return null;
    return (
      variants.find((item) => chosen.every(([key, value]) => item.options[key] === value)) ?? null
    );
  }, [selected, variants]);

  const missingChoices = usableAttributes.filter((attribute) => !selected[attribute.key]);
  const price = variant?.price ?? basePrice;
  const compareAt = variant?.price != null ? null : baseCompareAt;
  const onSale = compareAt !== null && compareAt > price;

  const variantSummary =
    usableAttributes.length > 0
      ? usableAttributes
          .map((attribute) => selected[attribute.key])
          .filter(Boolean)
          .join(' / ') || null
      : null;

  const fullySelected = missingChoices.length === 0;
  const soldOut = Boolean(variant && variant.trackStock && variant.stockQuantity <= 0);

  const inquiry = buildInquiryLink({
    contact,
    siteUrl,
    product: { name: productName, url: `${siteUrl}/products/${productSlug}` },
    variant: variantSummary,
  });

  const outOfStock = Boolean(variant && variant.trackStock) && soldOut;
  const lowStock = Boolean(variant && variant.trackStock && variant.stockQuantity > 0 && variant.stockQuantity <= 5);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">Price</p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className={cn('text-2xl font-semibold tabular-nums', onSale && 'text-sale')}>
              {formatPrice(price)}
            </span>
            {onSale ? (
              <span className="text-sm text-muted line-through">{formatPrice(compareAt)}</span>
            ) : null}
          </p>
        </div>
        <p
          className={cn(
            'text-[0.65rem] font-bold uppercase tracking-[0.16em]',
            outOfStock ? 'text-sale' : 'text-muted',
          )}
        >
          {outOfStock ? 'Out of stock' : lowStock ? 'Low stock' : variant ? 'Available' : ''}
        </p>
      </div>

      {usableAttributes.map((attribute) => (
        <fieldset key={attribute.id}>
          <legend className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
            {attribute.name || attribute.key}
            {selected[attribute.key] ? (
              <span className="ml-2 normal-case tracking-normal text-ink">— {selected[attribute.key]}</span>
            ) : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => {
              const active = selected[attribute.key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setSelected((current) => ({
                      ...current,
                      [attribute.key]: current[attribute.key] === value ? '' : value,
                    }))
                  }
                  className={cn(
                    'min-w-11 border px-3.5 py-2 text-sm transition',
                    active
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line text-ink hover:border-ink',
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {variants.length === 0 && usableAttributes.length === 0 ? null : (
        <p className="text-sm text-muted">
          {!fullySelected
            ? 'Choose your options to confirm the exact variant.'
            : variant
              ? `Selected: ${variant.name}`
              : 'That combination is not stocked — ask us and we will check for you.'}
        </p>
      )}

      <div className="border-t border-line pt-5">
        <InquiryButton
          href={inquiry.href}
          label={inquiry.label}
          message={inquiry.message}
          note={inquiry.note}
          variant="accent"
        />
        {!fullySelected ? (
          <p className="mt-2 text-xs text-muted">
            Tip: the prepared message includes your selected {usableAttributes.length > 1 ? 'options' : 'option'}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
