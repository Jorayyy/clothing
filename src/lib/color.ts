/**
 * Colour helpers used by the theme editor to keep admin-chosen palettes legible.
 */

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const value = match[1];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG 2.1 contrast ratio between two hex colours (1 – 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastLevel = 'fail' | 'large-only' | 'aa' | 'aaa';

export function assessContrast(foreground: string, background: string): {
  ratio: number;
  level: ContrastLevel;
  ok: boolean;
} {
  const ratio = contrastRatio(foreground, background);
  const level: ContrastLevel =
    ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : ratio >= 3 ? 'large-only' : 'fail';
  return { ratio, level, ok: ratio >= 3 };
}

export function pickReadableText(background: string, light = '#FFFFFF', dark = '#15130F'): string {
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}
