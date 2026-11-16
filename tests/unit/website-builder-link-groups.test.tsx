import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { applySiteOperations, ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantGroupedLinks } from '@/components/tenant/TenantGroupedLinks';
import { ZeroCodeStructureEditor } from '@/components/website-builder/ZeroCodeStructureEditor';
vi.mock('@/components/website-builder/WebsiteDesignPanel',()=>({WebsiteDesignPanel:()=>null}));
vi.mock('@/components/website-builder/SectionImagePicker',()=>({SectionImagePicker:()=>null}));
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
function fixture(){const c=buildDefaultSiteConfig({organizationName:'New Subscriber'});c.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'h',type:'hero',content:{title:'Welcome'}}]},{id:'detail',slug:'/services/consulting',title:'Consulting',showInNavigation:false,sections:[{id:'d',type:'hero',content:{title:'Consulting'}}]}];return c;}
it('keeps saved IDs after renaming pages and retains private revision/device URLs',()=>{
 const c=fixture();c.navigationGroups=[{label:'Services',pageIds:['detail']}];c.pages![1].slug='/new-consulting';c.pages![1].title='New consulting';
 const saved=ensureComposableSiteConfig(JSON.parse(JSON.stringify(c)));
 render(<TenantGroupedLinks config={saved} pathname="/new-consulting" basePath="/review?revision=saved&device=mobile&page="/>);
 fireEvent.click(screen.getByText('Services'));
 expect(screen.getByRole('link',{name:'New consulting'})).toHaveAttribute('href','/review?revision=saved&device=mobile&page=%2Fnew-consulting');
 expect(screen.getByRole('link')).toHaveAttribute('aria-current','page');
});
it('rejects unknown or executable page IDs and renders no cross-site destination',()=>{
 const c=fixture();c.navigationGroups=[{label:'Unsafe',pageIds:['javascript:alert(1)','another-tenant-page']}];
 expect(validateSiteConfig(c).errors.some(e=>e.code==='invalid_link_group')).toBe(true);
 const {container}=render(<TenantGroupedLinks config={c} pathname="/" basePath="/review"/>);expect(container.querySelector('a')).toBeNull();
});
it('saves and reopens header and footer groups through the shared editor API',async()=>{
 let saved=fixture();vi.stubGlobal('fetch',vi.fn(async(_url:string,options:RequestInit)=>{saved=ensureComposableSiteConfig(JSON.parse(String(options.body)).siteConfig);return {ok:true,json:async()=>({website:{site_config:saved}})}}));
 const {unmount}=render(<ZeroCodeStructureEditor websiteId="fixture" initialConfig={saved}/>);
 fireEvent.click(screen.getByText('Detailed page & section controls'));fireEvent.click(screen.getByText('Navigation and footer groups'));
 for(const label of ['Header','Footer']){fireEvent.click(screen.getByRole('button',{name:`Add ${label.toLowerCase()} group`}));const group=screen.getByRole('group',{name:`${label} group 1`});fireEvent.change(within(group).getByLabelText('Group label'),{target:{value:label==='Header'?'Services':'Explore'}});fireEvent.click(within(group).getByLabelText('Consulting'));}
 fireEvent.click(screen.getByRole('button',{name:'Save navigation groups'}));await waitFor(()=>expect(screen.getByText('Navigation groups saved.')).toBeTruthy());
 unmount();render(<ZeroCodeStructureEditor websiteId="fixture" initialConfig={saved}/>);fireEvent.click(screen.getByText('Detailed page & section controls'));fireEvent.click(screen.getByText('Navigation and footer groups'));
 expect(screen.getAllByLabelText('Consulting').every(c=>(c as HTMLInputElement).checked)).toBe(true);expect(saved.footer.linkGroups![0].pageIds).toEqual(['detail']);expect(saved.navigationGroups![0].label).toBe('Services');
});

it('removes deleted page references during PARIS edits without mutating the previous revision',()=>{
 const c=fixture();c.navigationGroups=[{label:'Explore',pageIds:['home','detail']}];c.footer.linkGroups=[{label:'Services',pageIds:['detail']}];
 const next=applySiteOperations(c,[{type:'delete_page',pageId:'detail'}]);
 expect(next.navigationGroups).toEqual([{label:'Explore',pageIds:['home']}]);expect(next.footer.linkGroups).toEqual([]);expect(c.navigationGroups[0].pageIds).toEqual(['home','detail']);expect(validateSiteConfig(next).valid).toBe(true);
});

it('composes saved header and footer groups for an ordinary subscriber with flat fallback',()=>{
 const config=fixture();config.navigationGroups=[{label:'Services',pageIds:['detail']}];config.footer.linkGroups=[{label:'Company',pageIds:['home','detail']}];
 const site={id:'subscriber',subdomain:'new-subscriber',siteName:'New Subscriber',organizationId:null,config};
 const {container,unmount}=render(<PublicTenantComposableSite site={site} basePath="/sites/new-subscriber"/>);
 const header=screen.getByRole('navigation',{name:'Main navigation'});fireEvent.click(within(header).getByText('Services'));expect(within(header).getByRole('link',{name:'Consulting'})).toHaveAttribute('href','/sites/new-subscriber/services/consulting');
 expect(within(screen.getByRole('navigation',{name:'Footer navigation'})).getByRole('heading',{name:'Company'})).toBeTruthy();expect(container.querySelector('.legacy83-premium')).toBeNull();
 unmount();render(<PublicTenantComposableSite site={{...site,config:fixture()}} basePath="/sites/new-subscriber"/>);expect(within(screen.getByRole('navigation',{name:'Main navigation'})).getByRole('link',{name:'Home'})).toBeTruthy();expect(screen.queryByText('Services')).toBeNull();
});
