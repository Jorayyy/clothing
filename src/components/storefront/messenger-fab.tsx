import { IconMessenger } from '@/components/ui/icons';

/**
 * Persistent, unobtrusive contact action. Pure link — no client JS, no popup.
 * Hidden on small screens while the keyboard is likely open is intentionally
 * NOT implemented (that would require intrusive viewport scripting); instead it
 * sits above the safe area and never covers primary content.
 */
export function MessengerFab({
  href,
  label,
  secondaryLabel,
}: {
  href: string | null;
  label: string;
  secondaryLabel?: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group fixed bottom-5 right-5 z-30 flex items-center gap-2.5 border border-transparent bg-accent px-4 py-3 text-on-accent shadow-lg transition hover:brightness-110 sm:bottom-7 sm:right-7"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label={`${label} — opens in a new tab`}
    >
      <IconMessenger size={20} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[0.16em] transition-all duration-300 group-hover:max-w-[14rem] group-focus-visible:max-w-[14rem] sm:max-w-[14rem]">
        {secondaryLabel ?? label}
      </span>
    </a>
  );
}
