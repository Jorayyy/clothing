import { NextResponse } from 'next/server';
import { z } from 'zod';

import { subscribeNewsletter } from '@/lib/queries/content';
import { consumeRateLimit, getClientIp } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().trim().min(3).max(200),
});

export async function POST(request: Request): Promise<NextResponse> {
  const ip = await getClientIp();
  const limit = await consumeRateLimit(`newsletter:${ip}`, 5, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: 'Too many attempts. Please try again in a few minutes.' },
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
    return NextResponse.json(
      { ok: false, message: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  const result = await subscribeNewsletter(parsed.data.email, 'site');
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
