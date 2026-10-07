import Image from 'next/image';
import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import type { RichBlock } from '@/lib/db/schema';
import { getMediaByIds } from '@/lib/media';
import { cn } from '@/lib/utils';

export async function RichContent({ blocks, className }: { blocks: RichBlock[]; className?: string }) {
  const list = Array.isArray(blocks) ? blocks : [];
  if (list.length === 0) return null;

  const imageIds = list.flatMap((block) => (block.type === 'image' && block.mediaId ? [block.mediaId] : []));
  const media = await getMediaByIds(imageIds);
  const mediaById = new Map<string, (typeof media)[number]>();
  imageIds.forEach((id, index) => mediaById.set(id, media[index]));

  return (
    <div className={cn('prose-site', className)}>
      {list.map((block, index) => (
        <Block key={index} block={block} mediaById={mediaById} />
      ))}
    </div>
  );
}

function Block({
  block,
  mediaById,
}: {
  block: RichBlock;
  mediaById: Map<string, Awaited<ReturnType<typeof getMediaByIds>>[number]>;
}) {
  switch (block.type) {
    case 'heading': {
      const text = block.text;
      if (block.level === 1) return <h1>{text}</h1>;
      if (block.level === 2) return <h2>{text}</h2>;
      return <h3>{text}</h3>;
    }
    case 'paragraph':
      return <p>{block.text}</p>;
    case 'list':
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case 'divider':
      return <hr />;
    case 'callout':
      return (
        <aside className="not-prose my-6 border-l-2 border-accent bg-surface px-5 py-4">
          {block.title ? <p className="text-sm font-semibold text-ink">{block.title}</p> : null}
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{block.text}</p>
        </aside>
      );
    case 'faq':
      return (
        <div className="not-prose my-6 space-y-3">
          {block.items.map((item, index) => (
            <details key={index} className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">{item.question}</summary>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      );
    case 'cta':
      return (
        <p className="not-prose my-6">
          <Link href={block.href} className="btn btn-outline">
            {block.label}
            <IconArrowRight size={16} />
          </Link>
        </p>
      );
    case 'image': {
      const asset = mediaById.get(block.mediaId);
      if (!asset?.url) return null;
      return (
        <figure className="not-prose my-6">
          <Image
            src={asset.url}
            alt={block.alt || asset.alt || ''}
            width={asset.width ?? 1200}
            height={asset.height ?? 800}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full"
          />
          {block.caption ? (
            <figcaption className="mt-2.5 text-xs text-muted">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
    default:
      return null;
  }
}
