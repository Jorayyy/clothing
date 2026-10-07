import 'server-only';

import { cache } from 'react';

import { getDb } from '@/lib/db';
import { settings as settingsTable } from '@/lib/db/schema';

import {
  settingsSchema,
  type Settings,
  type SettingsKey,
} from './schema';

export type {
  BrandSettings,
  ContactSettings,
  PaymentMethod,
  SeoSettings,
  Settings,
  SettingsKey,
  SocialLink,
  StoreSettings,
  ThemeSettings,
} from './schema';

const EMPTY: Record<SettingsKey, unknown> = {
  brand: {},
  theme: {},
  store: {},
  contact: {},
  social: {},
  seo: {},
};

async function readRows(): Promise<Record<string, unknown>> {
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: settingsTable.key, value: settingsTable.value })
      .from(settingsTable);
    const map: Record<string, unknown> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  } catch (error) {
    console.error('[settings] failed to read settings row:', error);
    return {};
  }
}

function merge(raw: Record<string, unknown>): Settings {
  const candidate = {
    brand: raw.brand ?? EMPTY.brand,
    theme: raw.theme ?? EMPTY.theme,
    store: raw.store ?? EMPTY.store,
    contact: raw.contact ?? EMPTY.contact,
    social: raw.social ?? EMPTY.social,
    seo: raw.seo ?? EMPTY.seo,
  };
  const parsed = settingsSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;

  console.error('[settings] stored settings failed validation, using defaults:', parsed.error.issues);
  const repaired = {} as Record<string, unknown>;
  for (const key of Object.keys(candidate) as SettingsKey[]) {
    const single = settingsSchema.shape[key].safeParse(candidate[key]);
    repaired[key] = single.success ? single.data : EMPTY[key];
  }
  return settingsSchema.parse(repaired);
}

/** Full, validated site settings. Memoised per request. */
export const getSettings = cache(async (): Promise<Settings> => merge(await readRows()));

/** Read a single settings slice (reuses the memoised full read). */
export async function getSetting<K extends SettingsKey>(key: K): Promise<Settings[K]> {
  const all = await getSettings();
  return all[key];
}

export async function writeSetting(key: SettingsKey, value: unknown): Promise<void> {
  const parsed = settingsSchema.shape[key].safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${key} settings: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }
  const db = await getDb();
  await db
    .insert(settingsTable)
    .values({ key, value: parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: parsed.data, updatedAt: new Date() } });
}

/* ------------------------------------------------------------------ */
/* Theme → CSS variables                                              */
/* ------------------------------------------------------------------ */

const WIDTH_PX: Record<Settings['theme']['layoutWidth'], number> = {
  narrow: 1140,
  regular: 1320,
  wide: 1560,
};

const RADIUS_PX: Record<Settings['theme']['radius'], string> = {
  none: '0px',
  sm: '3px',
  md: '8px',
  lg: '16px',
  full: '9999px',
};

const BUTTON_RADIUS: Record<Settings['theme']['buttonShape'], string> = {
  square: RADIUS_PX.none,
  rounded: '6px',
  pill: '9999px',
};

export function themeCssVars(theme: Settings['theme']): Record<string, string> {
  const c = theme.colors;
  return {
    '--site-bg': c.background,
    '--site-surface': c.surface,
    '--site-text': c.text,
    '--site-muted': c.muted,
    '--site-primary': c.primary,
    '--site-on-primary': c.onPrimary,
    '--site-accent': c.accent,
    '--site-on-accent': c.onAccent,
    '--site-border': c.border,
    '--site-sale': c.sale,
    '--site-container': `${WIDTH_PX[theme.layoutWidth]}px`,
    '--site-radius': RADIUS_PX[theme.radius],
    '--site-btn-radius': BUTTON_RADIUS[theme.buttonShape],
    '--site-gutter': theme.layoutWidth === 'narrow' ? '20px' : '24px',
  };
}

export function fontVars(fontPreset: Settings['theme']['fontPreset']): Record<string, string> {
  switch (fontPreset) {
    case 'grotesque':
      return {
        '--font-display-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-body-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-display-weight': '700',
        '--font-display-tracking': '-0.03em',
        '--font-body-tracking': '-0.01em',
      };
    case 'contrast':
      return {
        '--font-display-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-body-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-display-weight': '800',
        '--font-display-tracking': '-0.045em',
        '--font-body-tracking': '0em',
      };
    case 'editorial':
    default:
      return {
        '--font-display-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-body-stack': 'var(--font-jakarta), "Helvetica Neue", Arial, sans-serif',
        '--font-display-weight': '700',
        '--font-display-tracking': '-0.02em',
        '--font-body-tracking': '-0.01em',
      };
  }
}
