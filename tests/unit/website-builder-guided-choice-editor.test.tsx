import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ZeroCodeStructureEditor } from '@/components/website-builder/ZeroCodeStructureEditor';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

vi.mock('@/components/website-builder/WebsiteDesignPanel', () => ({ WebsiteDesignPanel: () => null }));
vi.mock('@/components/website-builder/SectionImagePicker', () => ({ SectionImagePicker: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('saves editable guided choices through the existing API and reopens returned saved content', async () => {
  let saved: TenantSiteConfig = buildDefaultSiteConfig({ organizationName: 'Another subscriber' });
  saved.pages = [{id:'home',slug:'/',title:'Home',sections:[{id:'next',type:'cta',settings:{layout:'split',imagePosition:'left'},content:{title:'Your priority',buttonText:'Contact us',buttonHref:'/contact',items:[{label:'Plan',description:'Make a plan.',href:'/contact'}]}}]}, {id:'contact',slug:'/contact',title:'Contact',sections:[{id:'contact-title',type:'hero',content:{title:'Contact'}}]}];
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe('/api/apps/website-builder/sites/subscriber-project');
    expect(init.method).toBe('PATCH');
    saved = ensureComposableSiteConfig(JSON.parse(String(init.body)).siteConfig);
    expect(validateSiteConfig(saved).errors).toEqual([]);
    return {ok:true,json:async()=>({website:{site_config:JSON.parse(JSON.stringify(saved))}})};
  });
  vi.stubGlobal('fetch', fetch);
  const {unmount} = render(<ZeroCodeStructureEditor websiteId="subscriber-project" initialConfig={saved} />);
  fireEvent.click(screen.getByText('Detailed page & section controls'));
  fireEvent.click(screen.getByRole('button',{name:'1. cta'}));
  fireEvent.change(screen.getByLabelText('Call to action layout'),{target:{value:'choices'}});
  await waitFor(()=>expect(screen.getByLabelText('Choice label 1')).toBeTruthy());
  expect(saved.pages![0].sections[0].settings).toEqual({layout:'choices',imagePosition:'left'});
  fireEvent.change(screen.getByLabelText('Explanation 1'),{target:{value:'A customer-authored explanation.'}});
  fireEvent.click(screen.getByRole('button',{name:'Add choice'}));
  fireEvent.change(screen.getByLabelText('Choice label 2'),{target:{value:'Lead'}});
  fireEvent.change(screen.getByLabelText('Destination 2'),{target:{value:'/contact'}});
  fireEvent.click(screen.getByRole('button',{name:'Save choices'}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Save choices'})).toBeEnabled());
  unmount();
  render(<ZeroCodeStructureEditor websiteId="subscriber-project" initialConfig={saved} />);
  fireEvent.click(screen.getByText('Detailed page & section controls'));
  fireEvent.click(screen.getByRole('button',{name:'1. cta'}));
  expect(screen.getByLabelText('Call to action layout')).toHaveValue('choices');
  expect(screen.getByLabelText('Explanation 1')).toHaveValue('A customer-authored explanation.');
  expect(screen.getByLabelText('Choice label 2')).toHaveValue('Lead');
  expect(saved.pages![0].sections[0].content.buttonHref).toBe('/contact');
});

it('preserves the existing product editor and synchronizes saved shop products', async () => {
  let saved = buildDefaultSiteConfig({ organizationName: 'Subscriber shop' });
  saved.pages = [{id:'home',slug:'/',title:'Home',sections:[{id:'home-title',type:'hero',content:{title:'Shop'}}]}, {id:'shop',slug:'/shop',title:'Shop',sections:[{id:'catalog',type:'products',content:{items:[{name:'A workbook',price:'$25',description:'Original description',href:'https://shop.example/workbook'}]}}]}];
  saved.products = [{name:'Unrelated product',href:'https://shop.example/other'}];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    saved = ensureComposableSiteConfig(JSON.parse(String(init.body)).siteConfig);
    expect(validateSiteConfig(saved).errors).toEqual([]);
    return {ok:true,json:async()=>({website:{site_config:saved}})};
  }));
  render(<ZeroCodeStructureEditor websiteId="shop-project" initialConfig={saved} />);
  fireEvent.click(screen.getByText('Detailed page & section controls'));
  fireEvent.click(screen.getByRole('button',{name:'Shop/shop'}));
  fireEvent.click(screen.getByRole('button',{name:'1. products'}));
  expect(screen.getByLabelText('Description 1')).toHaveValue('Original description');
  fireEvent.change(screen.getByLabelText('Displayed price 1'),{target:{value:'$30'}});
  fireEvent.click(screen.getByRole('button',{name:'Save products'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Save products'})).toBeEnabled());
  expect(saved.products).toEqual(expect.arrayContaining([
    expect.objectContaining({name:'Unrelated product'}),
    expect.objectContaining({name:'A workbook',price:'$30',description:'Original description'}),
  ]));
});
