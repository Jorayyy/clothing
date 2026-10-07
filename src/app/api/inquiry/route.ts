import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordInquiry } from '@/lib/queries/content';
import { consumeRateLimit, getClientIp } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  path: z.string().max(300).optional(),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).optional(),
  message: z.string().trim().max(3000).optional(),
  productId: z.string().max(60).optional(),
  productName: z.string().max(200).optional(),
  variantSummary: z.string().max(200).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const ip = await getClientIp();
  const limit = await consumeRateLimit(`inquiry:${ip}`, 15, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: 'Too many messages. Please try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Please check your message and try again.' }, { status: 400 });
  }

  const data = parsed.data;
  const hasMessage = Boolean(data.message);

  if (hasMessage && !data.name) {
    return NextResponse.json({ ok: false, message: 'Please add your name.' }, { status: 400 });
  }

  await recordInquiry({
    productId: data.productId ?? null,
    productName: data.productName ?? null,
    variantSummary: data.variantSummary ?? null,
    name: data.name ?? null,
    email: data.email ?? null,
    message: data.message ?? null,
    channel: hasMessage ? 'form' : 'messenger',
    source: hasMessage ? 'contact' : 'widget',
    referrerPath: data.path ?? null,
  });

  return NextResponse.json(
    {
      ok: true,
      message: hasMessage
        ? 'Saved to our inquiry list. For the fastest reply, message us on Messenger too — we reply there first.'
        : 'Logged.',
    },
    { status: 200 },
  );
}
