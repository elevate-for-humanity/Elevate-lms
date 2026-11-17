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
it('saves and reopens the introduction band placement and heading through the draft API', async () => {
  let saved = buildDefaultSiteConfig({ organizationName: 'Subscriber band' });
  saved.pages = [{ id: 'home', slug: '/', title: 'Home', sections: [{
    id: 'intro', type: 'hero', settings: { imageFit: 'contain' },
    content: { title: 'Owner headline', image: '/owner.jpg', narration: 'Approved transcript', audioUrl: '/audio/approved.mp3', musicUrl: '/audio/music.mp3' },
  }] }];
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    expect(url).toBe('/api/apps/website-builder/sites/customer');
    expect(options.method).toBe('PATCH');
    saved = ensureComposableSiteConfig(JSON.parse(String(options.body)).siteConfig);
    return { ok: true, json: async () => ({ website: { site_config: saved } }) };
  }));
  const openSection = () => {
    fireEvent.click(screen.getByText('Detailed page & section controls'));
    fireEvent.click(screen.getByRole('button', { name: '1. hero' }));
  };
  const { unmount } = render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved} />);
  openSection();
  fireEvent.change(screen.getByLabelText('Introduction placement'), { target: { value: 'before-hero' } });
  await waitFor(() => expect(screen.getByText('Introduction placement updated.')).toBeTruthy());
  const heading = screen.getByLabelText('Introduction heading');
  fireEvent.change(heading, { target: { value: 'A note from the owner' } });
  fireEvent.blur(heading);
  await waitFor(() => expect(screen.getByText('Section content updated.')).toBeTruthy());
  unmount();
  render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved} />);
  openSection();
  expect(screen.getByLabelText('Introduction placement')).toHaveValue('before-hero');
  expect(screen.getByLabelText('Introduction heading')).toHaveValue('A note from the owner');
  expect(saved.pages![0].sections[0]).toMatchObject({
    settings: { imageFit: 'contain', introductionPlacement: 'before-hero' },
    content: { title: 'Owner headline', image: '/owner.jpg', narration: 'Approved transcript', audioUrl: '/audio/approved.mp3', musicUrl: '/audio/music.mp3' },
  });
});
it('saves and reopens a supplied decorative hero image, placement and opacity',async()=>{
 let saved=buildDefaultSiteConfig({organizationName:'Subscriber studio'});
 saved.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',settings:{imageFit:'contain'},content:{title:'Our studio',image:'/owner.webp'}}]}];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
  expect(url).toBe('/api/apps/website-builder/sites/customer');expect(options.method).toBe('PATCH');
  saved=ensureComposableSiteConfig(JSON.parse(String(options.body)).siteConfig);
  return {ok:true,json:async()=>({website:{site_config:saved}})};
 }));
 const open=()=>{fireEvent.click(screen.getByText('Detailed page & section controls'));fireEvent.click(screen.getByRole('button',{name:'1. hero'}))};
 const {unmount}=render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved}/>);open();
 const image=screen.getByLabelText('Decorative hero image URL');fireEvent.change(image,{target:{value:'/approved-graphic.svg'}});fireEvent.blur(image);
 await waitFor(()=>expect(saved.pages![0].sections[0].content.backdropImage).toBe('/approved-graphic.svg'));
 fireEvent.change(screen.getByLabelText('Backdrop placement'),{target:{value:'right'}});
 await waitFor(()=>expect(saved.pages![0].sections[0].settings?.backdropPosition).toBe('right'));
 const opacity=screen.getByLabelText('Backdrop opacity (%)');fireEvent.change(opacity,{target:{value:'42.5'}});fireEvent.blur(opacity);
 await waitFor(()=>expect(saved.pages![0].sections[0].settings?.backdropOpacity).toBe(42.5));
 unmount();render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={saved}/>);open();
 expect(screen.getByLabelText('Decorative hero image URL')).toHaveValue('/approved-graphic.svg');
 expect(screen.getByLabelText('Backdrop placement')).toHaveValue('right');expect(screen.getByLabelText('Backdrop opacity (%)')).toHaveValue('42.5');
 expect(saved.pages![0].sections[0].content.image).toBe('/owner.webp');expect(saved.pages![0].sections[0].settings?.imageFit).toBe('contain');
});

it('does not persist nonnumeric or out-of-range opacity and repairs a visible invalid saved value',async()=>{
 const config=buildDefaultSiteConfig({organizationName:'Repair studio'});
 config.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',content:{title:'Welcome'},settings:{backdropOpacity:null}}]}];
 const save=vi.fn(async(_url:string,options:RequestInit)=>({ok:true,json:async()=>({website:{site_config:JSON.parse(String(options.body)).siteConfig}})}));
 vi.stubGlobal('fetch',save);render(<ZeroCodeStructureEditor websiteId="customer" initialConfig={config}/>);
 fireEvent.click(screen.getByText('Detailed page & section controls'));fireEvent.click(screen.getByRole('button',{name:'1. hero'}));
 const field=screen.getByLabelText('Backdrop opacity (%)');expect(field).toHaveValue('null');
 for(const value of ['abc','Infinity','-1','101','']) {
  fireEvent.change(field,{target:{value}});fireEvent.blur(field);
  await waitFor(()=>expect(screen.getByText('Backdrop opacity must be a number between 0 and 100.')).toBeTruthy());
  expect(save).not.toHaveBeenCalled();expect(field).toHaveValue(value);
 }
 fireEvent.change(field,{target:{value:'12'}});fireEvent.blur(field);
 await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));
 expect(JSON.parse(String(save.mock.calls[0][1].body)).siteConfig.pages[0].sections[0].settings.backdropOpacity).toBe(12);
});
