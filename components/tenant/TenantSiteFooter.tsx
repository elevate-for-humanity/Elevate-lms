'use client';

import { Facebook, Instagram, Linkedin, Link as LinkIcon, Youtube } from 'lucide-react';
import type {
  TenantSiteSocialLink,
  TenantSiteConfig,
  TenantSitePage,
} from '@/lib/tenant/site-types';
import { footerSocialLinks, safeFooterLogo } from '@/lib/tenant/footer-presentation';
import { resolveSiteLinkGroups } from '@/lib/tenant/site-navigation';
import { tenantSiteHref } from '@/lib/tenant/site-links';
import { TenantGroupedLinks } from './TenantGroupedLinks';
import { TenantFooterContact } from './TenantFooterContact';
import { useReadOnlyTenantPreview } from './TenantPreviewContext';

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  link: LinkIcon,
  youtube: Youtube,
};
function socialLabel(link: TenantSiteSocialLink) {
  const Icon = link.icon ? socialIcons[link.icon] : null;
  return (
    <>
      {Icon ? <Icon aria-hidden="true" className="h-5 w-5 shrink-0" /> : null}
      <span className={Icon ? 'sr-only' : undefined}>{link.label}</span>
    </>
  );
}

export function TenantSiteFooter({
  config,
  siteName,
  navigation,
  basePath,
  pathname,
}: {
  config: TenantSiteConfig;
  siteName: string;
  navigation: TenantSitePage[];
  basePath: string;
  pathname: string;
}) {
  const readOnly = useReadOnlyTenantPreview();
  const groups = resolveSiteLinkGroups(config.footer.linkGroups, config.pages || []);
  const columns = config.footer.layout === 'columns';
  const logo = config.footer.showLogo === true ? safeFooterLogo(config.branding.logoImage) : null;
  const social = footerSocialLinks(config);
  const brand = (
    <div className="min-w-0" data-footer-brand>
      {logo ? (
        <a
          href={tenantSiteHref('/', basePath)}
          className="block min-h-11 rounded focus-visible:outline focus-visible:outline-2"
        >
          <img
            data-footer-logo
            src={logo}
            alt=""
            aria-hidden="true"
            className="mb-3 h-14 w-auto max-w-full object-contain"
          />
          <span className="break-words font-black">{config.branding.logoText || siteName}</span>
        </a>
      ) : (
        <p className="break-words font-black">{config.branding.logoText || siteName}</p>
      )}
      <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-500">
        {config.footer.description}
      </p>
      {social.length ? (
        <ul aria-label="Social profiles" className="mt-3 flex flex-wrap gap-2">
          {social.map((link, index) => (
            <li key={index} className="min-w-0 max-w-full">
              {readOnly ? (
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-11 min-w-11 items-center break-all px-3 py-2 text-sm"
                >
                  {socialLabel(link)}
                </span>
              ) : (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center break-all rounded px-3 py-2 text-sm hover:underline focus-visible:outline focus-visible:outline-2"
                >
                  {socialLabel(link)}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
  const email = config.footer.contactEmail ? (
    readOnly ? (
      <span className="break-all font-bold" style={{ color: config.branding.primaryColor }}>
        {config.footer.contactEmail}
      </span>
    ) : (
      <a
        href={`mailto:${config.footer.contactEmail}`}
        className="break-all font-bold"
        style={{ color: config.branding.primaryColor }}
      >
        {config.footer.contactEmail}
      </a>
    )
  ) : null;
  const links = groups.length ? (
    <TenantGroupedLinks config={config} basePath={basePath} pathname={pathname} footer />
  ) : (
    navigation.map((item) => (
      <a
        className={columns ? 'min-h-11 break-words py-3' : undefined}
        key={item.id}
        href={tenantSiteHref(item.slug, basePath)}
      >
        {item.navLabel || item.title}
      </a>
    ))
  );
  return (
    <footer
      data-footer-layout={columns ? 'columns' : 'stacked'}
      className="border-t border-black/10 px-5 py-10 sm:px-6"
    >
      {columns ? (
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-1 gap-6 text-sm font-bold sm:grid-cols-2 lg:grid-cols-5"
          >
            {brand}
            {links}
            <TenantFooterContact config={config} />
          </nav>
          {email ? <div className="mt-6">{email}</div> : null}
        </div>
      ) : (
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5">
          {brand}
          {email}
          <nav
            aria-label="Footer navigation"
            className="flex w-full flex-wrap gap-5 text-sm font-bold"
          >
            {groups.length ? (
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {links}
                <TenantFooterContact config={config} />
              </div>
            ) : (
              <>
                {links}
                <TenantFooterContact config={config} />
              </>
            )}
          </nav>
        </div>
      )}
    </footer>
  );
}
