'use client';

import { useActionState, useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';

import {
  deleteNavigationItemAction,
  moveNavigationItemAction,
  saveNavigationItemAction,
} from './actions';

export interface NavItemInitial {
  id: string;
  menu: 'header' | 'footer' | 'mobile';
  label: string;
  href: string;
  kind: 'link' | 'categories' | 'collections';
  position: number;
  enabled: boolean;
  openInNewTab: boolean;
}

export function NavItemRow({
  item,
  canMoveUp,
  canMoveDown,
}: {
  item: NavItemInitial;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveNavigationItemAction,
    {},
  );
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [moveState, startMove] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const move = (direction: 'up' | 'down') => {
    startMove(async () => {
      const result = await moveNavigationItemAction(item.id, direction);
      if (result.error) setError(result.error);
      else setError(null);
    });
  };

  const remove = async () => {
    const result = await deleteNavigationItemAction(item.id);
    setConfirming(false);
    if (result.error) setError(result.error);
  };

  return (
    <li className="border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {item.label}
            {!item.enabled ? <span className="ml-2 tag tag-outline">hidden</span> : null}
          </p>
          <p className="truncate text-xs text-muted">
            {item.kind === 'link' ? item.href : `auto · ${item.kind}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => move('up')}
            disabled={!canMoveUp || moveState}
            className="btn btn-ghost btn-sm"
            aria-label={`Move ${item.label} up`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move('down')}
            disabled={!canMoveDown || moveState}
            className="btn btn-ghost btn-sm"
            aria-label={`Move ${item.label} down`}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="btn btn-outline btn-sm"
          >
            {open ? 'Close' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost btn-sm text-sale"
          >
            Delete
          </button>
        </div>
      </div>

      {error ? (
        <p className="border-t border-line px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      {open ? (
        <form action={formAction} className="space-y-3 border-t border-line p-4">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="menu" value={item.menu} />

          {state.error ? (
            <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.message}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="field">
              <span className="field-label">Label</span>
              <input className="input" name="label" defaultValue={item.label} required />
            </label>
            <label className="field sm:col-span-2">
              <span className="field-label">Destination</span>
              <input
                className="input"
                name="href"
                defaultValue={item.href}
                placeholder="/shop"
                disabled={item.kind !== 'link'}
              />
            </label>
            <label className="field">
              <span className="field-label">Kind</span>
              <select className="input appearance-none" name="kind" defaultValue={item.kind}>
                <option value="link">Link</option>
                <option value="categories">All categories</option>
                <option value="collections">All collections</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="field">
              <span className="field-label">Position</span>
              <input
                className="input"
                name="position"
                type="number"
                min={0}
                defaultValue={item.position}
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                value="1"
                defaultChecked={item.enabled}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Visible
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="openInNewTab"
                value="1"
                defaultChecked={item.openInNewTab}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Open in new tab
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={`Remove “${item.label}”?`}
        body="The menu item is removed from the site navigation."
        confirmLabel="Remove"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </li>
  );
}

export function NewNavItemForm({ menu }: { menu: 'header' | 'footer' | 'mobile' }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveNavigationItemAction,
    {},
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm">
        + Add {menu} item
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 border border-line bg-surface p-4">
      <input type="hidden" name="menu" value={menu} />
      <input type="hidden" name="enabled" value="1" />

      {state.error ? (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="field">
          <span className="field-label">Label</span>
          <input className="input" name="label" required placeholder="Shop" />
        </label>
        <label className="field sm:col-span-2">
          <span className="field-label">Destination</span>
          <input className="input" name="href" placeholder="/shop" />
        </label>
        <label className="field">
          <span className="field-label">Kind</span>
          <select className="input appearance-none" name="kind" defaultValue="link">
            <option value="link">Link</option>
            <option value="categories">All categories</option>
            <option value="collections">All collections</option>
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add item'}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
