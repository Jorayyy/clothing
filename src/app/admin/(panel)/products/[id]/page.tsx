import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { productAttributes, productCategories, productImages, products } from '@/lib/db/schema';
import { listMedia } from '@/lib/queries/admin-media';
import { getAllCategories } from '@/lib/queries/catalog';

import { ProductForm } from '../product-form';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();

  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const product = rows[0];
  if (!product) notFound();

  const [imageRows, categoryRows, attributeRows, mediaOptions, categories] = await Promise.all([
    db
      .select({ mediaId: productImages.mediaId })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position)),
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id)),
    db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.productId, id))
      .orderBy(asc(productAttributes.position)),
    listMedia(),
    getAllCategories(),
  ]);

  return (
    <>
      <AdminPageHeader title={product.name} description={`Editing /${product.slug}`} />
      <ProductForm
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          summary: product.summary,
          description: product.description,
          status: product.status,
          price: product.price,
          salePrice: product.salePrice,
          compareAtPrice: product.compareAtPrice,
          label: product.label,
          sku: product.sku,
          trackStock: product.trackStock,
          stockQuantity: product.stockQuantity,
          material: product.material,
          fit: product.fit,
          measurements: product.measurements,
          care: product.care,
          videoUrl: product.videoUrl,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          featured: product.featured,
          isNewArrival: product.isNewArrival,
          isBestSeller: product.isBestSeller,
          imageIds: imageRows.map((row) => row.mediaId),
          attributes: attributeRows.map((row) => ({
            key: row.key,
            name: row.name,
            values: row.values,
          })),
        }}
        mediaOptions={mediaOptions.map((row) => ({
          id: row.id,
          url: row.url,
          alt: row.alt,
          fileName: row.fileName,
        }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        categoryIds={categoryRows.map((row) => row.categoryId)}
      />
    </>
  );
}
