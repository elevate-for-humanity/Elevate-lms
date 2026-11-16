import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { resolveSiteLinkGroups } from '@/lib/tenant/site-navigation';
import { tenantSiteHref } from '@/lib/tenant/site-links';

export function TenantGroupedLinks({ config, basePath, pathname, footer = false, mobile = false }: {
  config: TenantSiteConfig; basePath: string; pathname: string; footer?: boolean; mobile?: boolean;
}) {
  const groups = resolveSiteLinkGroups(footer ? config.footer.linkGroups : config.navigationGroups, config.pages || []);
  return <>{groups.map(group => {
    const links = <ul className="space-y-1">{group.links.map(page => <li key={page.id}><a className="block min-h-11 whitespace-normal rounded px-3 py-3 text-sm hover:underline focus-visible:outline focus-visible:outline-2" href={tenantSiteHref(page.slug, basePath)} aria-current={page.slug === pathname ? 'page' : undefined}>{page.navLabel || page.title}</a></li>)}</ul>;
    return footer ? <div key={group.id} className="min-w-0"><h2 className="mb-2 text-base font-bold">{group.label}</h2>{links}</div> : <details key={`${pathname}:${group.id}`} className="relative min-w-0"><summary className="min-h-11 cursor-pointer py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2">{group.label}</summary><div className={mobile ? 'pl-3' : 'absolute left-0 z-30 max-h-[70vh] w-56 max-w-[80vw] overflow-y-auto rounded-xl border border-black/10 bg-white p-2 text-slate-900 shadow-xl'}>{links}</div></details>;
  })}</>;
}
