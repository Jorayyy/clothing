import { AdminPageHeader } from '@/components/admin/page-header';
import { getAllCategories } from '@/lib/queries/catalog';
import { listMedia } from '@/lib/queries/admin-media';

import { ProductForm } from '../product-form';

export const metadata = { title: 'New product' };

export default async function NewProductPage() {
  const [mediaOptions, categories] = await Promise.all([listMedia(), getAllCategories()]);

  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Draft it first — publishing pushes it to the storefront immediately."
      />
      <ProductForm
        mediaOptions={mediaOptions.map((row) => ({
          id: row.id,
          url: row.url,
          alt: row.alt,
          fileName: row.fileName,
        }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        categoryIds={[]}
      />
    </>
  );
}
