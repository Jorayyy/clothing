'use client';

import { useState } from 'react';

import { IconArrowRight, IconCheck } from '@/components/ui/icons';

export function NewsletterForm({
  buttonLabel = 'Subscribe',
  successMessage = 'You are on the list — thank you!',
  consentNote,
}: {
  buttonLabel?: string;
  successMessage?: string;
  consentNote?: string;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      if (data.ok) {
        setState('done');
        setMessage(successMessage);
        setEmail('');
      } else {
        setState('error');
        setMessage(data.message);
      }
    } catch {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-accent">
        <IconCheck size={16} />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg" noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === 'error') setState('idle');
          }}
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary btn-sm sm:btn" disabled={state === 'busy'}>
          {state === 'busy' ? 'Joining…' : buttonLabel}
          <IconArrowRight size={15} />
        </button>
      </div>
      {state === 'error' && message ? <p className="mt-2 text-sm text-sale">{message}</p> : null}
      {consentNote ? <p className="mt-2.5 text-xs leading-relaxed text-muted">{consentNote}</p> : null}
    </form>
  );
}
