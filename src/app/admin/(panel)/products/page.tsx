import Image from 'next/image';
import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/page-header';
import { EmptyState, Pagination } from '@/components/ui/misc';
import { formatDateTime, formatPrice } from '@/lib/format';
import { listAdminProducts } from '@/lib/queries/admin-products';
import { strParam } from '@/lib/utils';

import { ProductRowActions } from './product-row-actions';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_CHIP: Record<string, string> = {
  published: 'tag tag-accent',
  draft: 'tag tag-outline',
  archived: 'tag tag-sale',
};

export const metadata = { title: 'Products' };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = strParam(params.q) ?? '';
  const status = strParam(params.status) ?? 'all';
  const page = Math.max(1, Number(strParam(params.page) ?? 1) || 1);

  const result = await listAdminProducts({
    q: q || undefined,
    status: (status as 'all' | 'draft' | 'published' | 'archived') ?? 'all',
    page,
  });

  const filters: Record<string, string> = { status };
  if (q) filters.q = q;

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${result.total} product${result.total === 1 ? '' : 's'} in the catalogue.`}
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            Add product
          </Link>
        }
      />

      <form method="get" action="/admin/products" className="mb-5 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 sm:max-w-xs">
          <span className="field-label">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, handle or SKU"
            className="input"
          />
        </label>
        <label className="w-44 min-w-0">
          <span className="field-label">Status</span>
          <select name="status" defaultValue={status} className="input appearance-none">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-outline btn-sm">
          Filter
        </button>
        {q || status !== 'all' ? (
          <Link href="/admin/products" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <div className="border border-line bg-surface p-6">
          <EmptyState
            title="No products found"
            description="Adjust the filters, or add your first product."
            action={
              <Link href="/admin/products/new" className="btn btn-primary btn-sm mt-4">
                Add product
              </Link>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Price</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((product) => (
                <tr key={product.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-line bg-bg">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="block truncate font-medium hover:text-accent"
                        >
                          {product.name}
                        </Link>
                        <p className="truncate text-xs text-muted">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_CHIP[product.status] ?? 'tag tag-outline'}>
                      {product.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={product.salePrice ? 'text-sale' : ''}>
                      {formatPrice(product.salePrice ?? product.price)}
                    </span>
                    {product.salePrice ? (
                      <span className="ml-2 text-xs text-muted line-through">
                        {formatPrice(product.price)}
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-muted lg:table-cell">
                    {formatDateTime(product.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions id={product.id} status={product.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/admin/products"
          searchParams={filters}
        />
      </div>
    </>
  );
}
