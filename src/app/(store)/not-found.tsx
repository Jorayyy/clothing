import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';

export default function StoreNotFound() {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="section-title text-[clamp(2rem,5vw,3.5rem)]">This page has moved on</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The link may be outdated, or the piece is no longer listed. Browse the shop or send us a message and we
        will point you in the right direction.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Shop all products
          <IconArrowRight size={16} />
        </Link>
        <Link href="/" className="btn btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
