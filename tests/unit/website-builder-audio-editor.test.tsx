import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ZeroCodeStructureEditor } from '@/components/website-builder/ZeroCodeStructureEditor';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
vi.mock('@/components/website-builder/WebsiteDesignPanel',()=>({WebsiteDesignPanel:()=>null}));
vi.mock('@/components/website-builder/SectionImagePicker',()=>({SectionImagePicker:()=>null}));
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('saves customer recording/transcript fields through the shared draft API and reopens them',async()=>{
 let saved=buildDefaultSiteConfig({organizationName:'Subscriber recording'});
 saved.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'intro',type:'hero',content:{title:'Welcome',image:'/approved.jpg',narration:'Approved transcript'}}]}];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
  expect(url).toBe('/api/apps/website-builder/sites/customer');
  expect(options.method).toBe('PATCH');
  saved=ensureComposableSiteConfig(JSON.parse(String(options.body)).siteConfig);
  return{ok:true,json:async()=>({website:{site_config:saved}})};
 }));
 const {unmount}=render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved}/>);
 fireEvent.click(screen.getByText('Detailed page & section controls'));
 fireEvent.click(screen.getByRole('button',{name:'1. hero'}));
 const field=screen.getByLabelText('Recorded introduction URL');
 fireEvent.change(field,{target:{value:'https://assets.example/approved.mp3'}});fireEvent.blur(field);
 await waitFor(()=>expect(screen.getByText('Section content updated.')).toBeTruthy());
 unmount();render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved}/>);
 fireEvent.click(screen.getByText('Detailed page & section controls'));fireEvent.click(screen.getByRole('button',{name:'1. hero'}));
 expect(screen.getByLabelText('Recorded introduction URL')).toHaveValue('https://assets.example/approved.mp3');
 expect(screen.getByLabelText('Introduction transcript')).toHaveValue('Approved transcript');
 expect(saved.pages![0].sections[0].content.image).toBe('/approved.jpg');
});
