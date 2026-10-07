'use client';

import { useState } from 'react';

import { IconArrowRight, IconCheck } from '@/components/ui/icons';

interface ContactFormProps {
  contact: { email: string; phone: string };
}

/**
 * Records the message in the admin inquiry log. It does NOT claim the message
 * has been emailed anywhere — the page makes clear that Messenger is the
 * fastest way to reach us.
 */
export function ContactForm({ contact }: ContactFormProps) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'busy') return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').slice(0, 120),
      email: String(data.get('email') ?? '').slice(0, 200),
      message: String(data.get('message') ?? '').slice(0, 3000),
      path: '/contact',
    };

    if (!payload.name || !payload.message) {
      setState('error');
      setMessage('Please add your name and a short message.');
      return;
    }

    setState('busy');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { ok: boolean; message: string };
      if (result.ok) {
        setState('done');
        setMessage(result.message);
        form.reset();
      } else {
        setState('error');
        setMessage(result.message);
      }
    } catch {
      setState('error');
      setMessage('Something went wrong. Please message us on Messenger instead.');
    }
  };

  if (state === 'done') {
    return (
      <div className="border border-line bg-surface px-6 py-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-accent">
          <IconCheck size={18} />
          Message saved
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          For the fastest reply, open Messenger and send us the same note — we reply there first.
          {contact.email ? (
            <>
              {' '}
              You can also email <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>.
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="eyebrow mb-2 block">
            Your name
          </label>
          <input id="contact-name" name="name" type="text" required autoComplete="name" className="input w-full" />
        </div>
        <div>
          <label htmlFor="contact-email" className="eyebrow mb-2 block">
            Email <span className="normal-case tracking-normal text-muted">(optional)</span>
          </label>
          <input id="contact-email" name="email" type="email" autoComplete="email" className="input w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="eyebrow mb-2 block">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className="input w-full resize-y"
          placeholder="Tell us what you're looking for — style, size, colour, or an order question."
        />
      </div>

      {state === 'error' && message ? <p className="text-sm text-sale">{message}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={state === 'busy'}>
        {state === 'busy' ? 'Sending…' : 'Send message'}
        <IconArrowRight size={16} />
      </button>

      <p className="text-xs leading-relaxed text-muted">
        This form saves your message to our inquiry list. It does not send an email — Messenger is still the
        fastest way to reach us.
      </p>
    </form>
  );
}
