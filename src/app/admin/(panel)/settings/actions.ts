'use server';

import { revalidatePath } from 'next/cache';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import {
  brandSettingsSchema,
  contactSettingsSchema,
  seoSettingsSchema,
  socialSettingsSchema,
  storeSettingsSchema,
  themeSettingsSchema,
} from '@/lib/settings/schema';
import { writeSetting } from '@/lib/settings';

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === '1';
}

function lines(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');
    const parsed = brandSettingsSchema.safeParse({
      name: formData.get('name'),
      wordmark: formData.get('wordmark'),
      tagline: formData.get('tagline'),
      description: formData.get('description'),
      logoMediaId: String(formData.get('logoMediaId') ?? '') || null,
      faviconMediaId: String(formData.get('faviconMediaId') ?? '') || null,
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
    await writeSetting('brand', parsed.data);
    await recordAudit({ action: 'settings.brand', summary: 'Updated brand settings' });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Brand settings saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');
    const existing = contactSettingsSchema.parse({});
    const parsed = contactSettingsSchema.safeParse({
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      messengerPageUsername: formData.get('messengerPageUsername'),
      facebookPageUrl: formData.get('facebookPageUrl'),
      responseTimeNote: formData.get('responseTimeNote'),
      destinations: existing.destinations,
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
    await writeSetting('contact', parsed.data);
    await recordAudit({ action: 'settings.contact', summary: 'Updated contact settings' });
    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Contact settings saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveSeoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');
    const parsed = seoSettingsSchema.safeParse({
      siteUrl: formData.get('siteUrl'),
      titleTemplate: formData.get('titleTemplate'),
      defaultTitle: formData.get('defaultTitle'),
      defaultDescription: formData.get('defaultDescription'),
      ogImageMediaId: String(formData.get('ogImageMediaId') ?? '') || null,
      twitterHandle: formData.get('twitterHandle'),
      robotsEnabled: checkbox(formData, 'robotsEnabled'),
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
    await writeSetting('seo', parsed.data);
    await recordAudit({ action: 'settings.seo', summary: 'Updated SEO settings' });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'SEO settings saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveSocialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');
    const raw = String(formData.get('links') ?? '[]');
    let links: unknown = [];
    try {
      links = JSON.parse(raw);
    } catch {
      return fieldError('Social links could not be read.');
    }
    const parsed = socialSettingsSchema.safeParse({
      links,
      showcaseMediaIds: [],
      showcaseCaption: formData.get('showcaseCaption'),
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
    await writeSetting('social', parsed.data);
    await recordAudit({ action: 'settings.social', summary: 'Updated social links' });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Social links saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveStoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');

    const orderingSteps = lines(formData, 'orderingSteps').map((line) => {
      const [title = '', ...rest] = line.split('|');
      return { title: title.trim(), detail: rest.join('|').trim() };
    });

    const businessHours = lines(formData, 'businessHours').map((line) => {
      const [day = '', ...rest] = line.split('|');
      const hours = rest.join('|').trim();
      return { day: day.trim(), hours, closed: hours === '' };
    });

    const existing = storeSettingsSchema.parse({});
    const paymentRaw = String(formData.get('paymentMethods') ?? '[]');
    let paymentInput: unknown = existing.paymentMethods;
    try {
      paymentInput = JSON.parse(paymentRaw);
    } catch {
      /* keep defaults */
    }

    const parsed = storeSettingsSchema.safeParse({
      currency: 'PHP',
      announcement: {
        enabled: checkbox(formData, 'announcementEnabled'),
        text: formData.get('announcementText'),
        linkLabel: formData.get('announcementLinkLabel'),
        linkHref: formData.get('announcementLinkHref'),
      },
      paymentMethods: paymentInput,
      paymentNote: formData.get('paymentNote'),
      businessHours,
      orderingSteps: orderingSteps.length ? orderingSteps : existing.orderingSteps,
      serviceNote: formData.get('serviceNote'),
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');

    await writeSetting('store', parsed.data);
    await recordAudit({ action: 'settings.store', summary: 'Updated store settings' });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Store settings saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveThemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageTheme');
    const parsed = themeSettingsSchema.safeParse({
      colors: {
        background: formData.get('background'),
        surface: formData.get('surface'),
        text: formData.get('text'),
        muted: formData.get('muted'),
        primary: formData.get('primary'),
        onPrimary: formData.get('onPrimary'),
        accent: formData.get('accent'),
        onAccent: formData.get('onAccent'),
        border: formData.get('border'),
        sale: formData.get('sale'),
      },
      fontPreset: formData.get('fontPreset'),
      layoutWidth: formData.get('layoutWidth'),
      gridDensity: formData.get('gridDensity'),
      radius: formData.get('radius'),
      buttonShape: formData.get('buttonShape'),
      buttonStyle: formData.get('buttonStyle'),
      headerLayout: formData.get('headerLayout'),
      footerLayout: formData.get('footerLayout'),
      productCard: {
        imageRatio: formData.get('imageRatio'),
        hoverEffect: formData.get('hoverEffect'),
        showLabel: checkbox(formData, 'cardShowLabel'),
        showCategory: checkbox(formData, 'cardShowCategory'),
        showInquireButton: checkbox(formData, 'cardShowInquire'),
      },
      productPage: {
        gallery: formData.get('gallery'),
        infoPosition: formData.get('infoPosition'),
        showRelated: checkbox(formData, 'pageShowRelated'),
        showRecentlyViewed: checkbox(formData, 'pageShowRecent'),
      },
    });
    if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
    await writeSetting('theme', parsed.data);
    await recordAudit({ action: 'settings.theme', summary: 'Updated theme settings' });
    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Theme saved.' };
  } catch (error) {
    return toActionError(error);
  }
}
