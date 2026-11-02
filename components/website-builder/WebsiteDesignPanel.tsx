'use client';
import { useState } from 'react';
import { WebsiteDesignPicker } from './WebsiteDesignPicker';
import { useWebsiteConfig } from './WebsiteConfigProvider';
import { applyWebsiteDesign, readWebsiteDesign, type WebsiteDesignChoices } from '@/lib/website-builder/design-choices';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export function WebsiteDesignPanel({websiteId,initialConfig}:{websiteId:string;initialConfig:TenantSiteConfig}) {
 const [config,setConfig]=useWebsiteConfig(initialConfig);
 const [choices,setChoices]=useState(()=>readWebsiteDesign(config.meta?.designPreferences));
 const [palette,setPalette]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 function preview(value:WebsiteDesignChoices){setChoices(value);setStatus('Preview updated. Save to retain these choices.');setConfig(current=>applyWebsiteDesign(current,value,{applyPalette:palette}));}
 async function save(){setBusy(true);setStatus('');try{const next=applyWebsiteDesign(config,choices,{applyPalette:palette});const response=await fetch(`/api/apps/website-builder/sites/${websiteId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteConfig:next})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not save your design choices.');setConfig(data.website?.site_config||next);setStatus('Template, layout, picture direction and speaker saved.');}catch(error){setStatus(error instanceof Error?error.message:'Could not save your choices.');}finally{setBusy(false);}}
 return <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-6"><h2 className="text-xl font-black">Design your website</h2><p className="mt-2 text-sm text-slate-600">Try a different template, layout or speaker in your preview. Your pages, products and photos stay in place.</p><WebsiteDesignPicker value={choices} onChange={preview} disabled={busy}/><label className="block text-sm"><input type="checkbox" checked={palette} onChange={event=>setPalette(event.target.checked)}/> Use the selected template’s colors when saving</label><button type="button" disabled={busy} onClick={()=>void save()} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">{busy?'Saving…':'Save design choices'}</button>{status?<p role="status" className="mt-3 text-sm">{status}</p>:null}</div></section>;
}
