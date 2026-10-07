import type { ContactSettings, ContactDestination } from '@/lib/settings/schema';

export type InquiryMethod = 'messenger-ref' | 'messenger' | 'facebook' | 'destination' | 'none';

export interface InquiryProduct {
  name: string;
  url: string;
}

export interface InquiryInput {
  contact: ContactSettings;
  /** Absolute site origin, used to build canonical product URLs. */
  siteUrl: string;
  product?: InquiryProduct;
  /** Human readable variant summary, e.g. "Black / M". */
  variant?: string | null;
  path?: string;
}

export interface InquiryLink {
  href: string;
  method: InquiryMethod;
  label: string;
  /** Message prepared for the customer to paste into the chat. */
  message: string;
  /** Honest description of what the link does — surfaced in the UI. */
  note: string;
}

const MESSENGER_REF_MAX = 64;

function normaliseUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
    .replace(/^m\.me\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '');
}

function resolveDestination(destinations: ContactDestination[], channel: ContactDestination['channel']) {
  return destinations.find((destination) => destination.enabled && destination.channel === channel);
}

function absolute(url: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Builds the prepared chat message. Messenger has no supported API for
 * pre-filling a user's message, so we hand the customer a ready-to-paste
 * message and open the conversation separately.
 */
export function buildInquiryMessage(input: InquiryInput): string {
  const lines: string[] = [];
  const brand = input.contact.messengerPageUsername || 'MicsApparel';
  lines.push('Hi MicsApparel!');
  if (input.product) {
    lines.push('');
    lines.push(`I'm interested in: ${input.product.name}`);
    if (input.variant) lines.push(`Variant: ${input.variant}`);
    lines.push(`Link: ${absolute(input.product.url, input.siteUrl)}`);
    lines.push('');
    lines.push('Is this available? Please send me the details for ordering. Thank you!');
  } else {
    lines.push('');
    lines.push("I'd like to ask about your collection. Please send me the details. Thank you!");
  }
  void brand;
  return lines.join('\n');
}

/**
 * Resolves where an "Inquire" button should go.
 *
 * Messenger does not expose a supported way to pre-fill the customer's message,
 * so the product-specific data is carried by (a) a copyable prepared message and
 * (b) a short `ref` tag on the m.me link when a page username is configured.
 * We never claim the details appear in Messenger automatically.
 */
export function buildInquiryLink(input: InquiryInput): InquiryLink {
  const message = buildInquiryMessage(input);
  const { contact } = input;
  const username = normaliseUsername(contact.messengerPageUsername);

  if (username) {
    const ref = input.product
      ? `p:${input.product.url.split('/').filter(Boolean).pop() ?? ''}`.slice(0, MESSENGER_REF_MAX)
      : 'site';
    return {
      href: `https://m.me/${username}?ref=${encodeURIComponent(ref)}`,
      method: 'messenger-ref',
      label: 'Chat on Messenger',
      message,
      note: 'Opens Messenger. Copy the prepared message above to send with your inquiry.',
    };
  }

  const messengerDestination = resolveDestination(contact.destinations, 'messenger');
  if (messengerDestination?.value) {
    const fallbackUsername = normaliseUsername(messengerDestination.value);
    if (fallbackUsername) {
      return {
        href: `https://m.me/${fallbackUsername}`,
        method: 'messenger',
        label: 'Chat on Messenger',
        message,
        note: 'Opens Messenger. Copy the prepared message above to send with your inquiry.',
      };
    }
    if (/^https?:\/\//i.test(messengerDestination.value)) {
      return {
        href: messengerDestination.value,
        method: 'messenger',
        label: 'Chat on Messenger',
        message,
        note: 'Opens Messenger. Copy the prepared message above to send with your inquiry.',
      };
    }
  }

  const facebookUrl = contact.facebookPageUrl;
  if (facebookUrl) {
    return {
      href: facebookUrl,
      method: 'facebook',
      label: 'Message us on Facebook',
      message,
      note: 'Opens our Facebook page — send the prepared message above in a new message.',
    };
  }

  const generic =
    resolveDestination(contact.destinations, 'viber') ??
    resolveDestination(contact.destinations, 'whatsapp') ??
    resolveDestination(contact.destinations, 'instagram');
  if (generic?.value) {
    const href = /^https?:\/\//i.test(generic.value)
      ? generic.value
      : generic.channel === 'whatsapp'
        ? `https://wa.me/${generic.value.replace(/[^\d]/g, '')}`
        : generic.value;
    return {
      href,
      method: 'destination',
      label: generic.label,
      message,
      note: 'Copy the prepared message above and send it to us.',
    };
  }

  return {
    href: '/contact',
    method: 'none',
    label: 'Contact us',
    message,
    note: 'No chat destination is configured yet — use our contact page.',
  };
}

export function buildGeneralInquiryLink(input: InquiryInput): InquiryLink {
  return buildInquiryLink({ ...input, product: undefined, variant: null });
}

/** Share URLs for a product page. */
export function buildShareLinks(url: string, title: string): { label: string; href: string }[] {
  const absoluteUrl = encodeURI(url);
  const encodedTitle = encodeURIComponent(title);
  return [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${absoluteUrl}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${absoluteUrl}&text=${encodedTitle}` },
    {
      label: 'Messenger',
      href: `https://www.facebook.com/dialog/send?link=${absoluteUrl}&app_id=1667517577441464&redirect_uri=${absoluteUrl}`,
    },
  ];
}
