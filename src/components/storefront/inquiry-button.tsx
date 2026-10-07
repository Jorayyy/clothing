'use client';

import { useState } from 'react';

import { IconCheck, IconCopy, IconMessenger } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface InquiryButtonProps {
  href: string;
  label: string;
  message: string;
  note: string;
  variant?: 'primary' | 'accent' | 'outline';
  className?: string;
  showNote?: boolean;
  /** Path recorded in the admin inquiry log when the chat link is opened. */
  recordPath?: string;
}

/**
 * Two honest actions side by side:
 *  1. open the chat destination (Messenger cannot pre-fill the customer's message),
 *  2. copy the prepared message so it can be pasted into the chat.
 */
export function InquiryButton({
  href,
  label,
  message,
  note,
  variant = 'accent',
  className,
  showNote = true,
  recordPath,
}: InquiryButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt('Copy this message and paste it in the chat:', message);
    }
  };

  const record = () => {
    if (!recordPath) return;
    try {
      void fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: recordPath }),
        keepalive: true,
      });
    } catch {
      /* never block the customer on analytics */
    }
  };

  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-accent';

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={record}
          className={cn('btn', variantClass)}
        >
          <IconMessenger size={16} />
          {label}
        </a>
        <button type="button" onClick={copy} className="btn btn-outline">
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? 'Message copied' : 'Copy prepared message'}
        </button>
      </div>
      {showNote ? <p className="max-w-md text-xs leading-relaxed text-muted">{note}</p> : null}
    </div>
  );
}
