'use client';
import { useEffect, useState } from 'react';
import { resolveSiteLinkGroups } from '@/lib/tenant/site-navigation';
import type { TenantSiteConfig, TenantSiteLinkGroup } from '@/lib/tenant/site-types';

export function WebsiteLinkGroupsEditor({ config, busy, onSave }: {
  config: TenantSiteConfig; busy: boolean; onSave: (next: TenantSiteConfig) => void;
}) {
  const editable = (groups: unknown) => resolveSiteLinkGroups(groups, config.pages || []).map(group => ({ label: group.label, pageIds: group.links.map(page => page.id) }));
  const [header, setHeader] = useState(() => editable(config.navigationGroups));
  const [footer, setFooter] = useState(() => editable(config.footer.linkGroups));
  useEffect(() => {
    const read = (groups: unknown) => resolveSiteLinkGroups(groups, config.pages || []).map(group => ({ label: group.label, pageIds: group.links.map(page => page.id) }));
    setHeader(read(config.navigationGroups)); setFooter(read(config.footer.linkGroups));
  }, [config]);
  function controls(label: string, groups: TenantSiteLinkGroup[], update: (groups: TenantSiteLinkGroup[]) => void) {
    return <fieldset disabled={busy} className="space-y-3"><legend className="font-bold">{label}</legend>{groups.map((group, index) => <fieldset key={index} className="rounded border p-3">
      <legend>{label} group {index + 1}</legend>
      <label className="block">Group label<input className="ml-2 rounded border p-2" value={group.label} onChange={e => update(groups.map((g, i) => i === index ? { ...g, label: e.target.value } : g))} /></label>
      <p className="my-2 text-sm">Choose pages in the order they should appear. Hidden pages can be included explicitly.</p>
      {(config.pages || []).map(page => <label key={page.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={group.pageIds.includes(page.id)} onChange={e => update(groups.map((g, i) => i === index ? { ...g, pageIds: e.target.checked ? [...g.pageIds, page.id] : g.pageIds.filter(id => id !== page.id) } : g))} />{page.title}</label>)}
      <div className="flex flex-wrap gap-3"><button type="button" disabled={index === 0} onClick={() => { const next = [...groups]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update(next); }}>Move group up</button><button type="button" onClick={() => update(groups.filter((_, i) => i !== index))}>Remove group</button></div>
    </fieldset>)}<button type="button" disabled={groups.length >= 8} onClick={() => update([...groups, { label: '', pageIds: [] }])}>Add {label.toLowerCase()} group</button></fieldset>;
  }
  const invalid = [...header, ...footer].some(g => !g.label.trim() || !g.pageIds.length);
  return <details className="mt-5 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-bold">Navigation and footer groups</summary><p className="my-3 text-sm">Organize your saved pages without entering URLs. With no groups, the existing page navigation remains.</p>
    <div className="grid gap-5 md:grid-cols-2">{controls('Header', header, setHeader)}{controls('Footer', footer, setFooter)}</div>
    <button type="button" disabled={busy || invalid} className="mt-4 min-h-11 rounded bg-slate-950 px-4 py-2 text-white disabled:opacity-50" onClick={() => onSave({ ...config, navigationGroups: header, footer: { ...config.footer, linkGroups: footer } })}>Save navigation groups</button>
  </details>;
}
