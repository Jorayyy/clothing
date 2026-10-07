'use client';

import { useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm';
import type { ActionState } from '@/lib/admin/action-state';

import { deleteInquiryAction, setInquiryStatusAction } from './actions';

const STATUSES = ['new', 'open', 'resolved', 'spam'] as const;

export function InquiryActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<ActionState>({});

  const change = (next: string) => {
    startTransition(async () => {
      const result = await setInquiryStatusAction(id, next);
      if (result.error) setState(result);
      else setState({ ok: true, message: result.message });
    });
  };

  const remove = async () => {
    const result = await deleteInquiryAction(id);
    setConfirming(false);
    setState(result.error ? { error: result.error } : { ok: true, message: 'Deleted.' });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        className="input w-32 appearance-none py-1.5 text-xs"
        value={status}
        disabled={isPending}
        aria-label="Inquiry status"
        onChange={(event) => change(event.target.value)}
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="btn btn-ghost btn-sm text-sale"
      >
        Delete
      </button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}

      <ConfirmDialog
        open={confirming}
        title="Delete this inquiry?"
        body="The message is removed from the admin list."
        confirmLabel="Delete"
        tone="danger"
        busy={isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </div>
  );
}
