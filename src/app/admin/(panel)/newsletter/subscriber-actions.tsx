'use client';

import { useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm';
import type { ActionState } from '@/lib/admin/action-state';

import { deleteSubscriberAction } from './actions';

export function SubscriberActions({ id, email }: { id: string; email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({});

  const remove = () => {
    startTransition(async () => {
      const result = await deleteSubscriberAction(id);
      setConfirming(false);
      setState(result.error ? { error: result.error } : { ok: true });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="btn btn-ghost btn-sm text-sale"
      >
        Remove
      </button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}

      <ConfirmDialog
        open={confirming}
        title={`Remove ${email}?`}
        body="They will stop receiving newsletter email. This does not affect anything else."
        confirmLabel="Remove"
        tone="danger"
        busy={isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </>
  );
}
