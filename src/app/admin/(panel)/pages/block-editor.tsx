'use client';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import type { RichBlock } from '@/lib/db/schema';

const BLOCK_LABELS: Record<RichBlock['type'], string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  list: 'List',
  image: 'Image',
  divider: 'Divider',
  callout: 'Callout',
  faq: 'FAQ',
  cta: 'Button',
};

function makeBlock(type: RichBlock['type']): RichBlock {
  switch (type) {
    case 'heading':
      return { type, level: 2, text: '' };
    case 'paragraph':
      return { type, text: '' };
    case 'list':
      return { type, items: [''] };
    case 'image':
      return { type, mediaId: '', alt: '', caption: '' };
    case 'divider':
      return { type };
    case 'callout':
      return { type, title: '', text: '' };
    case 'faq':
      return { type, items: [{ question: '', answer: '' }] };
    case 'cta':
      return { type, label: '', href: '' };
  }
}

export function BlockEditor({
  value,
  onChange,
  mediaOptions,
}: {
  value: RichBlock[];
  onChange: (blocks: RichBlock[]) => void;
  mediaOptions: MediaOption[];
}) {
  const update = (index: number, patch: Partial<RichBlock>) => {
    const next = value.map((block, position) =>
      position === index ? ({ ...block, ...patch } as RichBlock) : block,
    );
    onChange(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [block] = next.splice(index, 1);
    if (!block) return;
    next.splice(target, 0, block);
    onChange(next);
  };

  const remove = (index: number) => onChange(value.filter((_, position) => position !== index));

  const add = (type: RichBlock['type']) => onChange([...value, makeBlock(type)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCK_LABELS) as RichBlock['type'][]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="btn btn-outline btn-sm"
          >
            + {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      {value.length === 0 ? (
        <p className="border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          No content yet. Add a block above — visitors will see a placeholder until then.
        </p>
      ) : null}

      <ol className="space-y-3">
        {value.map((block, index) => (
          <li key={index} className="border border-line bg-bg p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {index + 1}. {BLOCK_LABELS[block.type]}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="btn btn-ghost btn-sm"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  className="btn btn-ghost btn-sm"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="btn btn-ghost btn-sm text-sale"
                  aria-label="Remove block"
                >
                  Remove
                </button>
              </span>
            </div>

            <BlockFields block={block} mediaOptions={mediaOptions} onChange={(patch) => update(index, patch)} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function BlockFields({
  block,
  mediaOptions,
  onChange,
}: {
  block: RichBlock;
  mediaOptions: MediaOption[];
  onChange: (patch: Partial<RichBlock>) => void;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <label className="field">
            <span className="field-label">Level</span>
            <select
              className="input appearance-none"
              value={block.level}
              onChange={(event) =>
                onChange({ level: Number(event.target.value) as 1 | 2 | 3 })
              }
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Text</span>
            <input
              className="input"
              value={block.text}
              onChange={(event) => onChange({ text: event.target.value })}
            />
          </label>
        </div>
      );

    case 'paragraph':
      return (
        <label className="field">
          <span className="field-label">Text</span>
          <textarea
            className="input"
            rows={5}
            value={block.text}
            onChange={(event) => onChange({ text: event.target.value })}
          />
        </label>
      );

    case 'list':
      return (
        <label className="field">
          <span className="field-label">Items (one per line)</span>
          <textarea
            className="input"
            rows={5}
            value={block.items.join('\n')}
            onChange={(event) =>
              onChange({ items: event.target.value.split('\n').map((line) => line.trim()) })
            }
          />
        </label>
      );

    case 'image':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <MediaPicker
            options={mediaOptions}
            value={block.mediaId ? [block.mediaId] : []}
            onChange={(ids) => onChange({ mediaId: ids[0] ?? '' })}
            label="Image"
          />
          <div className="space-y-3">
            <label className="field">
              <span className="field-label">Alt text</span>
              <input
                className="input"
                value={block.alt ?? ''}
                onChange={(event) => onChange({ alt: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Caption</span>
              <input
                className="input"
                value={block.caption ?? ''}
                onChange={(event) => onChange({ caption: event.target.value })}
              />
            </label>
          </div>
        </div>
      );

    case 'divider':
      return <p className="text-sm text-muted">A horizontal rule. No settings.</p>;

    case 'callout':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">Title</span>
            <input
              className="input"
              value={block.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Text</span>
            <input
              className="input"
              value={block.text}
              onChange={(event) => onChange({ text: event.target.value })}
            />
          </label>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={index} className="grid gap-3 border border-line bg-surface p-3 sm:grid-cols-2">
              <label className="field">
                <span className="field-label">Question</span>
                <input
                  className="input"
                  value={item.question}
                  onChange={(event) => {
                    const items = block.items.map((row, position) =>
                      position === index ? { ...row, question: event.target.value } : row,
                    );
                    onChange({ items });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">Answer</span>
                <textarea
                  className="input"
                  rows={3}
                  value={item.answer}
                  onChange={(event) => {
                    const items = block.items.map((row, position) =>
                      position === index ? { ...row, answer: event.target.value } : row,
                    );
                    onChange({ items });
                  }}
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ items: block.items.filter((_, position) => position !== index) })
                  }
                  className="btn btn-ghost btn-sm text-sale"
                >
                  Remove question
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ items: [...block.items, { question: '', answer: '' }] })
            }
            className="btn btn-outline btn-sm"
          >
            + Add question
          </button>
        </div>
      );

    case 'cta':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">Label</span>
            <input
              className="input"
              value={block.label}
              onChange={(event) => onChange({ label: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Link</span>
            <input
              className="input"
              value={block.href}
              onChange={(event) => onChange({ href: event.target.value })}
              placeholder="/shop"
            />
          </label>
        </div>
      );
  }
}
