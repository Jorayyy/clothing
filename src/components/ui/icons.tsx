import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ));

export const IconMenu = (p: IconProps) =>
  base(p, (
    <>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </>
  ));

export const IconClose = (p: IconProps) =>
  base(p, (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ));

export const IconChevronDown = (p: IconProps) => base(p, <path d="m6 9 6 6 6-6" />);
export const IconChevronLeft = (p: IconProps) => base(p, <path d="m15 18-6-6 6-6" />);
export const IconChevronRight = (p: IconProps) => base(p, <path d="m9 18 6-6-6-6" />);

export const IconArrowRight = (p: IconProps) =>
  base(p, (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ));

export const IconArrowUpRight = (p: IconProps) =>
  base(p, (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ));

export const IconCopy = (p: IconProps) =>
  base(p, (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
    </>
  ));

export const IconCheck = (p: IconProps) => base(p, <path d="m5 12.5 4.5 4.5L19 7" />);
export const IconPlus = (p: IconProps) => base(p, <path d="M12 5v14M5 12h14" />);
export const IconMinus = (p: IconProps) => base(p, <path d="M5 12h14" />);
export const IconTrash = (p: IconProps) =>
  base(p, (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </>
  ));

export const IconEdit = (p: IconProps) =>
  base(p, (
    <>
      <path d="M4 20h4l10-10a2.8 2.8 0 1 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ));

export const IconUpload = (p: IconProps) =>
  base(p, (
    <>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </>
  ));

export const IconEye = (p: IconProps) =>
  base(p, (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ));

export const IconEyeOff = (p: IconProps) =>
  base(p, (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8" />
      <path d="M6.3 8.3A17 17 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 3.9-.8" />
    </>
  ));

export const IconExternal = (p: IconProps) =>
  base(p, (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ));

export const IconDrag = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" />
    </>
  ));

export const IconLayers = (p: IconProps) =>
  base(p, (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ));

export const IconPackage = (p: IconProps) =>
  base(p, (
    <>
      <path d="M21 8.5v7L12 21l-9-5.5v-7L12 3l9 5.5Z" />
      <path d="m3 8.5 9 5.5 9-5.5" />
      <path d="M12 14v7" />
    </>
  ));

export const IconGrid = (p: IconProps) =>
  base(p, (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ));

export const IconImage = (p: IconProps) =>
  base(p, (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-2 4 4" />
    </>
  ));

export const IconSettings = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 8.9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.5A1.7 1.7 0 0 0 10.5 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ));

export const IconUser = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ));

export const IconLogout = (p: IconProps) =>
  base(p, (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ));

export const IconAlert = (p: IconProps) =>
  base(p, (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </>
  ));

export const IconInfo = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8v.1" />
    </>
  ));

export const IconMessenger = (p: IconProps) =>
  base(p, (
    <path
      d="M12 3C6.9 3 3 6.8 3 11.6c0 2.7 1.2 5 3.1 6.6v3.2l2.9-1.6c.9.3 1.9.4 3 .4 5.1 0 9-3.8 9-8.6S17.1 3 12 3Zm.9 11.4-2.3-2.4-4.4 2.4 4.8-5.1 2.3 2.4 4.4-2.4-4.8 5.1Z"
      fill="currentColor"
      stroke="none"
    />
  ));

export const IconFacebook = (p: IconProps) =>
  base(p, (
    <path
      d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.6 3 10.5 4.5 10.5 6.8v1.7H8.5V11h2v10h3.5V11h2.4l.4-2.5H14Z"
      fill="currentColor"
      stroke="none"
    />
  ));

export const IconInstagram = (p: IconProps) =>
  base(p, (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </>
  ));

export const IconTikTok = (p: IconProps) =>
  base(p, (
    <path
      d="M16 3c.3 2.1 1.6 3.4 3.7 3.6v2.6c-1.4.1-2.7-.3-3.9-1.1v5.6c0 4-3.3 6.7-7 6.3-2.7-.3-4.8-2.6-5-5.4-.2-3.4 2.6-6.3 6-6.3.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.7 0-3 1.4-2.9 3.1.1 1.4 1.2 2.5 2.6 2.7 1.7.2 3.2-1.1 3.2-2.8V3H16Z"
      fill="currentColor"
      stroke="none"
    />
  ));

export const IconX = (p: IconProps) =>
  base(p, (
    <path
      d="M17.2 3H20l-6.1 7 7.2 11h-5.6l-4.4-6.4L5.9 21H3l6.6-7.5L2.7 3H8.4l4 5.9L17.2 3Zm-1 16.2h1.6L7.9 4.7H6.2l10 14.5Z"
      fill="currentColor"
      stroke="none"
    />
  ));

export const IconYoutube = (p: IconProps) =>
  base(p, (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5v-5Z" fill="currentColor" stroke="none" />
    </>
  ));

export function SocialIcon({ platform, ...props }: IconProps & { platform: string }) {
  switch (platform) {
    case 'facebook':
      return <IconFacebook {...props} />;
    case 'instagram':
      return <IconInstagram {...props} />;
    case 'tiktok':
      return <IconTikTok {...props} />;
    case 'x':
      return <IconX {...props} />;
    case 'youtube':
      return <IconYoutube {...props} />;
    case 'messenger':
      return <IconMessenger {...props} />;
    default:
      return <IconArrowUpRight {...props} />;
  }
}
