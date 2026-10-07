'use client';

import { useActionState, useState } from 'react';

import { MediaPicker, type MediaOption } from '@/components/admin/media-library';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/admin/action-state';
import type { Settings } from '@/lib/settings/schema';

import {
  saveBrandAction,
  saveContactAction,
  saveSeoAction,
  saveSocialAction,
  saveStoreAction,
  saveThemeAction,
} from './actions';

function Feedback({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.message}
      </p>
    );
  }
  return null;
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  type = 'text',
  textarea,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </span>
      {textarea ? (
        <textarea
          className="input"
          name={name}
          rows={3}
          defaultValue={defaultValue ?? ''}
          required={required}
        />
      ) : (
        <input
          className="input"
          name={name}
          type={type}
          defaultValue={defaultValue ?? ''}
          required={required}
        />
      )}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="input appearance-none" name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[var(--site-accent)]"
      />
      {label}
    </label>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

const COLOR_FIELDS: { key: keyof Settings['theme']['colors']; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'primary', label: 'Primary' },
  { key: 'onPrimary', label: 'On primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'onAccent', label: 'On accent' },
  { key: 'border', label: 'Border' },
  { key: 'sale', label: 'Sale' },
];

export function SettingsForm({
  settings,
  mediaOptions,
}: {
  settings: Settings;
  mediaOptions: MediaOption[];
}) {
  const [brandState, brandAction, brandPending] = useActionState<ActionState, FormData>(
    saveBrandAction,
    {},
  );
  const [contactState, contactAction, contactPending] = useActionState<ActionState, FormData>(
    saveContactAction,
    {},
  );
  const [storeState, storeAction, storePending] = useActionState<ActionState, FormData>(
    saveStoreAction,
    {},
  );
  const [socialState, socialAction, socialPending] = useActionState<ActionState, FormData>(
    saveSocialAction,
    {},
  );
  const [seoState, seoAction, seoPending] = useActionState<ActionState, FormData>(saveSeoAction, {});
  const [themeState, themeAction, themePending] = useActionState<ActionState, FormData>(
    saveThemeAction,
    {},
  );

  const [logoId, setLogoId] = useState<string[]>(settings.brand.logoMediaId ? [settings.brand.logoMediaId] : []);
  const [links, setLinks] = useState(settings.social.links);

  return (
    <div className="space-y-8">
      <Panel title="Brand" description="Name, wordmark and the copy that introduces the store.">
        <form action={brandAction} className="space-y-4">
          <input type="hidden" name="logoMediaId" value={logoId[0] ?? ''} />
          <input
            type="hidden"
            name="faviconMediaId"
            value={settings.brand.faviconMediaId ?? ''}
          />
          <Feedback state={brandState} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" name="name" defaultValue={settings.brand.name} required />
            <Field label="Wordmark" name="wordmark" defaultValue={settings.brand.wordmark} required />
          </div>
          <Field label="Tagline" name="tagline" defaultValue={settings.brand.tagline} />
          <Field label="Description" name="description" defaultValue={settings.brand.description} textarea />
          <MediaPicker
            options={mediaOptions}
            value={logoId}
            onChange={(ids) => setLogoId(ids.slice(0, 1))}
            label="Logo"
          />
          <Button type="submit" variant="primary" size="sm" disabled={brandPending}>
            {brandPending ? 'Saving…' : 'Save brand'}
          </Button>
        </form>
      </Panel>

      <Panel
        title="Contact & Messenger"
        description="Drives every “Inquire” button. Set your Facebook page username to enable m.me links."
      >
        <form action={contactAction} className="space-y-4">
          <Feedback state={contactState} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" defaultValue={settings.contact.email} />
            <Field label="Phone" name="phone" defaultValue={settings.contact.phone} />
            <Field
              label="Facebook page username"
              name="messengerPageUsername"
              defaultValue={settings.contact.messengerPageUsername}
              hint="Just the username, e.g. micsapparel — not the full URL."
            />
            <Field
              label="Facebook page URL"
              name="facebookPageUrl"
              defaultValue={settings.contact.facebookPageUrl}
            />
          </div>
          <Field label="Address" name="address" defaultValue={settings.contact.address} />
          <Field
            label="Response time note"
            name="responseTimeNote"
            defaultValue={settings.contact.responseTimeNote}
          />
          <Button type="submit" variant="primary" size="sm" disabled={contactPending}>
            {contactPending ? 'Saving…' : 'Save contact'}
          </Button>
        </form>
      </Panel>

      <Panel title="Store" description="Announcement bar, payment notes, hours and ordering steps.">
        <form action={storeAction} className="space-y-4">
          <input
            type="hidden"
            name="paymentMethods"
            value={JSON.stringify(settings.store.paymentMethods)}
          />
          <Feedback state={storeState} />

          <fieldset className="border border-line p-4">
            <legend className="px-2 text-sm font-semibold">Announcement bar</legend>
            <div className="space-y-3">
              <Check
                label="Show the announcement bar"
                name="announcementEnabled"
                defaultChecked={settings.store.announcement.enabled}
              />
              <Field
                label="Text"
                name="announcementText"
                defaultValue={settings.store.announcement.text}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Link label"
                  name="announcementLinkLabel"
                  defaultValue={settings.store.announcement.linkLabel}
                />
                <Field
                  label="Link"
                  name="announcementLinkHref"
                  defaultValue={settings.store.announcement.linkHref}
                />
              </div>
            </div>
          </fieldset>

          <Field
            label="Payment note"
            name="paymentNote"
            defaultValue={settings.store.paymentNote}
            textarea
          />
          <Field label="Service note" name="serviceNote" defaultValue={settings.store.serviceNote} textarea />

          <Field
            label="Ordering steps"
            name="orderingSteps"
            hint="One per line as Title | Detail"
            textarea
            defaultValue={settings.store.orderingSteps
              .map((step) => `${step.title} | ${step.detail}`)
              .join('\n')}
          />
          <Field
            label="Business hours"
            name="businessHours"
            hint="One per line as Day | Hours (leave hours empty to mark closed)"
            textarea
            defaultValue={settings.store.businessHours
              .map((row) => `${row.day} | ${row.hours}`)
              .join('\n')}
          />

          <Button type="submit" variant="primary" size="sm" disabled={storePending}>
            {storePending ? 'Saving…' : 'Save store'}
          </Button>
        </form>
      </Panel>

      <Panel title="Social links" description="Shown in the footer and the Messenger block.">
        <form action={socialAction} className="space-y-4">
          <input type="hidden" name="links" value={JSON.stringify(links)} />
          <Feedback state={socialState} />

          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={link.id} className="grid gap-3 border border-line p-3 sm:grid-cols-12">
                <label className="field sm:col-span-3">
                  <span className="field-label">Label</span>
                  <input
                    className="input"
                    value={link.label}
                    onChange={(event) =>
                      setLinks((current) =>
                        current.map((row, position) =>
                          position === index ? { ...row, label: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className="field sm:col-span-6">
                  <span className="field-label">URL</span>
                  <input
                    className="input"
                    value={link.href}
                    placeholder="https://…"
                    onChange={(event) =>
                      setLinks((current) =>
                        current.map((row, position) =>
                          position === index ? { ...row, href: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm sm:col-span-3">
                  <input
                    type="checkbox"
                    checked={link.enabled}
                    onChange={(event) =>
                      setLinks((current) =>
                        current.map((row, position) =>
                          position === index ? { ...row, enabled: event.target.checked } : row,
                        ),
                      )
                    }
                    className="h-4 w-4 accent-[var(--site-accent)]"
                  />
                  Enabled
                </label>
              </div>
            ))}
          </div>

          <Field
            label="Showcase caption"
            name="showcaseCaption"
            defaultValue={settings.social.showcaseCaption}
          />

          <Button type="submit" variant="primary" size="sm" disabled={socialPending}>
            {socialPending ? 'Saving…' : 'Save social links'}
          </Button>
        </form>
      </Panel>

      <Panel title="SEO" description="Defaults for page titles, descriptions and the sitemap.">
        <form action={seoAction} className="space-y-4">
          <input
            type="hidden"
            name="ogImageMediaId"
            value={settings.seo.ogImageMediaId ?? ''}
          />
          <Feedback state={seoState} />
          <Field
            label="Site URL"
            name="siteUrl"
            defaultValue={settings.seo.siteUrl}
            hint="https://your-domain.com — required for a correct sitemap."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default title" name="defaultTitle" defaultValue={settings.seo.defaultTitle} />
            <Field
              label="Title template"
              name="titleTemplate"
              defaultValue={settings.seo.titleTemplate}
              hint="%s is replaced by the page title."
            />
          </div>
          <Field
            label="Default description"
            name="defaultDescription"
            defaultValue={settings.seo.defaultDescription}
            textarea
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="X / Twitter handle"
              name="twitterHandle"
              defaultValue={settings.seo.twitterHandle}
            />
            <div className="pt-6">
              <Check label="Allow search engines to index the site" name="robotsEnabled" defaultChecked={settings.seo.robotsEnabled} />
            </div>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={seoPending}>
            {seoPending ? 'Saving…' : 'Save SEO'}
          </Button>
        </form>
      </Panel>

      <Panel title="Theme" description="Colours and layout. Changes apply across the whole storefront.">
        <form action={themeAction} className="space-y-5">
          <Feedback state={themeState} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLOR_FIELDS.map((field) => (
              <label key={field.key} className="field">
                <span className="field-label">{field.label}</span>
                <input
                  className="input h-11 p-1"
                  type="color"
                  name={field.key}
                  defaultValue={settings.theme.colors[field.key]}
                />
              </label>
            ))}
          </div>

          <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Type preset"
              name="fontPreset"
              defaultValue={settings.theme.fontPreset}
              options={[
                { value: 'editorial', label: 'Editorial' },
                { value: 'grotesque', label: 'Grotesque' },
                { value: 'contrast', label: 'Contrast' },
              ]}
            />
            <Select
              label="Layout width"
              name="layoutWidth"
              defaultValue={settings.theme.layoutWidth}
              options={[
                { value: 'narrow', label: 'Narrow' },
                { value: 'regular', label: 'Regular' },
                { value: 'wide', label: 'Wide' },
              ]}
            />
            <Select
              label="Grid density"
              name="gridDensity"
              defaultValue={settings.theme.gridDensity}
              options={[
                { value: '2', label: '2 per row' },
                { value: '3', label: '3 per row' },
                { value: '4', label: '4 per row' },
              ]}
            />
            <Select
              label="Corner radius"
              name="radius"
              defaultValue={settings.theme.radius}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'full', label: 'Pill' },
              ]}
            />
            <Select
              label="Button shape"
              name="buttonShape"
              defaultValue={settings.theme.buttonShape}
              options={[
                { value: 'square', label: 'Square' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'pill', label: 'Pill' },
              ]}
            />
            <Select
              label="Button style"
              name="buttonStyle"
              defaultValue={settings.theme.buttonStyle}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
                { value: 'underline', label: 'Underline' },
              ]}
            />
            <Select
              label="Header layout"
              name="headerLayout"
              defaultValue={settings.theme.headerLayout}
              options={[
                { value: 'split', label: 'Split' },
                { value: 'centered', label: 'Centred' },
                { value: 'minimal', label: 'Minimal' },
              ]}
            />
            <Select
              label="Footer layout"
              name="footerLayout"
              defaultValue={settings.theme.footerLayout}
              options={[
                { value: 'columns', label: 'Columns' },
                { value: 'stacked', label: 'Stacked' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
          </div>

          <div className="grid gap-6 border-t border-line pt-4 sm:grid-cols-2">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Product cards</legend>
              <Select
                label="Image ratio"
                name="imageRatio"
                defaultValue={settings.theme.productCard.imageRatio}
                options={[
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'square', label: 'Square' },
                  { value: 'tall', label: 'Tall' },
                ]}
              />
              <Select
                label="Hover effect"
                name="hoverEffect"
                defaultValue={settings.theme.productCard.hoverEffect}
                options={[
                  { value: 'zoom', label: 'Zoom' },
                  { value: 'swap', label: 'Swap' },
                  { value: 'none', label: 'None' },
                ]}
              />
              <Check label="Show label" name="cardShowLabel" defaultChecked={settings.theme.productCard.showLabel} />
              <Check label="Show category" name="cardShowCategory" defaultChecked={settings.theme.productCard.showCategory} />
              <Check
                label="Show inquire button"
                name="cardShowInquire"
                defaultChecked={settings.theme.productCard.showInquireButton}
              />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Product page</legend>
              <Select
                label="Gallery"
                name="gallery"
                defaultValue={settings.theme.productPage.gallery}
                options={[
                  { value: 'thumbnails', label: 'Thumbnails' },
                  { value: 'stacked', label: 'Stacked' },
                ]}
              />
              <Select
                label="Details position"
                name="infoPosition"
                defaultValue={settings.theme.productPage.infoPosition}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
              <Check
                label="Show related products"
                name="pageShowRelated"
                defaultChecked={settings.theme.productPage.showRelated}
              />
              <Check
                label="Show recently viewed"
                name="pageShowRecent"
                defaultChecked={settings.theme.productPage.showRecentlyViewed}
              />
            </fieldset>
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={themePending}>
            {themePending ? 'Saving…' : 'Save theme'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
