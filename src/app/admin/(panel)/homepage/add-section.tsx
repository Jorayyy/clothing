'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';

import { saveSectionAction } from './actions';

export function AddSectionForm({
  options,
  nextPosition,
}: {
  options: { value: string; label: string }[];
  nextPosition: number;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveSectionAction, {});
  const [type, setType] = useState(options[0]?.value ?? '');

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border border-line bg-surface p-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="enabled" value="1" />
      <input type="hidden" name="position" value={nextPosition} />
      <input type="hidden" name="title" value="" />

      <label className="field w-full sm:w-72">
        <span className="field-label">Section type</span>
        <select
          className="input appearance-none"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" variant="primary" size="sm" disabled={pending || !type}>
        {pending ? 'Adding…' : 'Add section'}
      </Button>

      {state.error ? <span className="text-sm text-red-700">{state.error}</span> : null}
      {state.ok ? <span className="text-sm text-emerald-700">Section added — configure it below.</span> : null}
    </form>
  );
}
