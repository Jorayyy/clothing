'use client';

import { useActionState, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';

import { deleteUserAction, saveUserAction } from './actions';

interface UserInitial {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export function UserForm({ user, isSelf }: { user?: UserInitial; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveUserAction, {});
  const [confirming, setConfirming] = useState(false);
  const [deleteState, setDeleteState] = useState<ActionState>({});

  const remove = async () => {
    if (!user) return;
    const result = await deleteUserAction(user.id);
    setConfirming(false);
    if (result.error) setDeleteState(result);
    else setDeleteState({ ok: true, message: 'User deleted.' });
  };

  return (
    <form action={formAction} className="space-y-3">
      {user ? <input type="hidden" name="userId" value={user.id} /> : null}

      {state.error ? (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">
            Name <span className="text-accent">*</span>
          </span>
          <input className="input" name="name" defaultValue={user?.name ?? ''} required />
        </label>
        <label className="field">
          <span className="field-label">
            Email <span className="text-accent">*</span>
          </span>
          <input
            className="input"
            type="email"
            name="email"
            defaultValue={user?.email ?? ''}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Role</span>
          <select className="input appearance-none" name="role" defaultValue={user?.role ?? 'editor'}>
            <option value="viewer">Viewer — read only</option>
            <option value="editor">Editor — products & content</option>
            <option value="admin">Admin — settings & catalog</option>
            <option value="owner">Owner — everything, including users</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input appearance-none"
            name="status"
            defaultValue={user?.status ?? 'active'}
            disabled={isSelf}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">
          {user ? 'New password' : 'Password'}
          {user ? null : <span className="ml-1 text-accent">*</span>}
        </span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="new-password"
          required={!user}
          placeholder={user ? 'Leave blank to keep the current password' : 'At least 10 characters'}
        />
        {user ? (
          <span className="mt-1 block text-xs text-muted">
            Saving a new password signs their other sessions out.
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Saving…' : user ? 'Save changes' : 'Create user'}
        </Button>
        {user && !isSelf ? (
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
        title={`Delete ${user?.email}?`}
        body="Their access is revoked immediately and any active session stops working."
        confirmLabel="Delete"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </form>
  );
}
