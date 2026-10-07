'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface MediaOption {
  id: string;
  url: string;
  alt: string;
  fileName: string;
}

export function MediaPicker({
  options,
  value,
  onChange,
  label = 'Images',
  hint,
}: {
  options: MediaOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? options.filter((option) =>
        `${option.fileName} ${option.alt}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  const selected = new Set(value);
  const byId = new Map(options.map((option) => [option.id, option]));

  const toggle = (id: string) => {
    if (selected.has(id)) onChange(value.filter((existing) => existing !== id));
    else onChange([...value, id]);
  };

  const makeCover = (id: string) => onChange([id, ...value.filter((existing) => existing !== id)]);
  const remove = (id: string) => onChange(value.filter((existing) => existing !== id));

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {hint ? <p className="mb-2 text-xs text-muted">{hint}</p> : null}

      <div className="flex flex-wrap gap-3">
        {value.map((id, index) => {
          const option = byId.get(id);
          if (!option) return null;
          return (
            <div key={id} className="relative w-24">
              <div className="relative h-28 w-24 overflow-hidden border border-line bg-bg">
                <Image src={option.url} alt={option.alt} fill sizes="96px" className="object-cover" />
              </div>
              <p className="mt-1 truncate text-[0.65rem] text-muted">
                {index === 0 ? 'Cover · ' : ''}
                {option.fileName}
              </p>
              <div className="mt-1 flex gap-1">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => makeCover(id)}
                    className="border border-line px-1.5 py-0.5 text-[0.65rem] hover:border-ink"
                  >
                    Cover
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="border border-line px-1.5 py-0.5 text-[0.65rem] text-sale hover:border-ink"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen((current) => !current)} className="btn btn-outline btn-sm">
          {open ? 'Close library' : value.length ? 'Add more' : 'Choose images'}
        </button>
        <span className="text-xs text-muted">{value.length} selected</span>
      </div>

      {open ? (
        <div className="mt-3 border border-line bg-bg p-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by file name or alt text"
            className="input mb-3"
          />
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No media matches that filter.</p>
          ) : (
            <ul className="grid max-h-72 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
              {filtered.map((option) => {
                const isSelected = selected.has(option.id);
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => toggle(option.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'block w-full border-2 bg-surface transition',
                        isSelected ? 'border-accent' : 'border-transparent hover:border-line',
                      )}
                    >
                      <span className="relative block aspect-square w-full overflow-hidden bg-bg">
                        <Image
                          src={option.url}
                          alt={option.alt}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </span>
                      <span className="block truncate px-1 py-1 text-[0.65rem] text-muted">
                        {option.fileName}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
