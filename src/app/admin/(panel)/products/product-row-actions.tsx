'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteProductAction, setProductStatusAction } from './actions';
import { ConfirmDialog } from '@/components/ui/confirm';

export function ProductRowActions({
  id,
  status,
}: {
  id: string;
  status: 'draft' | 'published' | 'archived';
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = () => {
    const next = status === 'published' ? 'draft' : 'published';
    startTransition(async () => {
      const result = await setProductStatusAction(id, next);
      if (result.error) setError(result.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteProductAction(id);
      setConfirming(false);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
      <button
        type="button"
        onClick={toggleStatus}
        disabled={isPending}
        className="btn btn-ghost btn-sm"
      >
        {status === 'published' ? 'Unpublish' : 'Publish'}
      </button>
      <Link href={`/admin/products/${id}`} className="btn btn-outline btn-sm">
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="btn btn-ghost btn-sm text-sale"
      >
        Delete
      </button>

      <ConfirmDialog
        open={confirming}
        title="Delete this product?"
        body="The product, its variants and its image links are removed. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </div>
  );
}
