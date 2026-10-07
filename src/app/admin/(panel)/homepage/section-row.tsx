'use client';

import { useActionState, useState, useTransition } from 'react';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import { ConfirmDialog } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';

import { deleteSectionAction, moveSectionAction, saveSectionAction } from './actions';
import { SECTION_FIELDS, type FieldSpec } from './section-fields';

export interface SectionInitial {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  position: number;
  config: Record<string, unknown>;
}

function FieldControl({
  spec,
  value,
  mediaOptions,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  mediaOptions: MediaOption[];
  onChange: (next: unknown) => void;
}) {
  const text = (value: unknown) => (value === undefined || value === null ? '' : String(value));

  if (spec.kind === 'boolean') {
    return (
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          name={spec.key}
          value="1"
          defaultChecked={value === true}
          className="h-4 w-4 accent-[var(--site-accent)]"
        />
        {spec.label}
      </label>
    );
  }

  if (spec.kind === 'media') {
    const ids = typeof value === 'string' && value ? [value] : [];
    return (
      <MediaPicker
        options={mediaOptions}
        value={ids}
        onChange={(next) => onChange(next[0] ?? '')}
        label={spec.label}
        hint={spec.hint}
      />
    );
  }

  if (spec.kind === 'mediaList') {
    const ids = Array.isArray(value) ? (value as string[]) : [];
    return (
      <MediaPicker
        options={mediaOptions}
        value={ids}
        onChange={onChange}
        label={spec.label}
        hint={spec.hint}
      />
    );
  }

  if (spec.kind === 'textarea' || spec.kind === 'lines') {
    return (
      <label className="field">
        <span className="field-label">{spec.label}</span>
        <textarea
          className="input"
          name={spec.key}
          rows={spec.kind === 'lines' ? 4 : 3}
          defaultValue={
            spec.kind === 'lines' && Array.isArray(value)
              ? (value as string[]).join('\n')
              : text(value)
          }
          placeholder={spec.hint}
        />
        {spec.hint ? <span className="mt-1 block text-xs text-muted">{spec.hint}</span> : null}
      </label>
    );
  }

  if (spec.kind === 'select') {
    return (
      <label className="field">
        <span className="field-label">{spec.label}</span>
        <select className="input appearance-none" name={spec.key} defaultValue={text(value)}>
          {spec.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (spec.kind === 'number') {
    return (
      <label className="field">
        <span className="field-label">{spec.label}</span>
        <input
          className="input"
          name={spec.key}
          type="number"
          min={1}
          max={24}
          defaultValue={Number(value ?? 8)}
          placeholder={spec.hint}
        />
      </label>
    );
  }

  return (
    <label className="field">
      <span className="field-label">{spec.label}</span>
      <input className="input" name={spec.key} defaultValue={text(value)} placeholder={spec.hint} />
    </label>
  );
}

export function SectionRow({
  section,
  label,
  description,
  mediaOptions,
  canMoveUp,
  canMoveDown,
}: {
  section: SectionInitial;
  label: string;
  description: string;
  mediaOptions: MediaOption[];
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveSectionAction, {});
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, unknown>>(section.config);
  const [isPending, startMove] = useTransition();

  const fields = SECTION_FIELDS[section.type] ?? [];

  const move = (direction: 'up' | 'down') => {
    startMove(async () => {
      const result = await moveSectionAction(section.id, direction);
      if (result.error) setError(result.error);
      else setError(null);
    });
  };

  const remove = async () => {
    const result = await deleteSectionAction(section.id);
    setConfirming(false);
    if (result.error) setError(result.error);
  };

  return (
    <li className="border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-medium">
            {section.title || label}
            {!section.enabled ? <span className="ml-2 tag tag-outline">hidden</span> : null}
          </p>
          <p className="truncate text-xs text-muted">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => move('up')}
            disabled={!canMoveUp || isPending}
            className="btn btn-ghost btn-sm"
            aria-label="Move section up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move('down')}
            disabled={!canMoveDown || isPending}
            className="btn btn-ghost btn-sm"
            aria-label="Move section down"
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
            Remove
          </button>
        </div>
      </div>

      {error ? <p className="border-t border-line px-5 py-2 text-xs text-red-700">{error}</p> : null}

      {open ? (
        <form action={formAction} className="space-y-4 border-t border-line p-5">
          <input type="hidden" name="sectionId" value={section.id} />
          <input type="hidden" name="type" value={section.type} />

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

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field">
              <span className="field-label">Internal title</span>
              <input
                className="input"
                name="title"
                defaultValue={section.title}
                placeholder={label}
              />
            </label>
            <label className="field">
              <span className="field-label">Position</span>
              <input
                className="input"
                name="position"
                type="number"
                min={0}
                defaultValue={section.position}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                value="1"
                defaultChecked={section.enabled}
                className="h-4 w-4 accent-[var(--site-accent)]"
              />
              Visible on the homepage
            </label>
          </div>

          <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            {fields.map((spec) => (
              <FieldControl
                key={spec.key}
                spec={spec}
                value={config[spec.key]}
                mediaOptions={mediaOptions}
                onChange={(next) => setConfig((current) => ({ ...current, [spec.key]: next }))}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? 'Saving…' : 'Save section'}
            </Button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Remove this section?"
        body="The section disappears from the homepage. Nothing else is affected."
        confirmLabel="Remove"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </li>
  );
}
