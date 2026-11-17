import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
vi.mock('@/components/voice/useNaturalVoice',()=>({useNaturalVoice:()=>({isPlaying:false,isLoading:false,play:vi.fn(),stop:vi.fn()})}));
afterEach(cleanup);
function site(image?: unknown,settings:Record<string,unknown>={}) {
 const config=buildDefaultSiteConfig({organizationName:'Independent book studio'});
 config.pages=[{id:'home',title:'Home',slug:'/',sections:[{id:'hero',type:'hero',content:{title:'Our studio',image:'/owner.webp',imageAlt:'Owner portrait',backdropImage:image,buttonText:'Contact',buttonHref:'/contact'},settings}]}];
 return {id:'subscriber',subdomain:'books',siteName:'Independent book studio',organizationId:null,config};
}
it('round trips a supplied decorative background independently of foreground content',()=>{
 const original=site('https://assets.example/graphic.svg',{backdropPosition:'right',backdropOpacity:12});
 const snapshot=JSON.stringify(original);
 const saved={...original,config:ensureComposableSiteConfig(JSON.parse(snapshot).config)};
 const {container}=render(<PublicTenantComposableSite site={saved}/>);
 const image=container.querySelector('.tenant-hero-backdrop') as HTMLImageElement;
 expect(image).toHaveAttribute('src','https://assets.example/graphic.svg');
 expect(image).toHaveAttribute('aria-hidden','true');expect(image.alt).toBe('');
 expect(image.style.opacity).toBe('0.12');expect(image.style.width).toBe('65%');
 expect(image.style.pointerEvents).toBe('none');expect(image.style.position).toBe('absolute');
 expect(screen.getByAltText('Owner portrait')).toHaveAttribute('src','/owner.webp');
 expect(screen.getByRole('heading',{name:'Our studio'})).toBeTruthy();
 expect(JSON.stringify(original)).toBe(snapshot);
 expect(validateSiteConfig(saved.config).errors.filter(e=>e.code.startsWith('invalid_hero_backdrop'))).toEqual([]);
});
it('leaves existing sites unchanged without an opted-in graphic',()=>{
 const {container}=render(<PublicTenantComposableSite site={site()}/>);
 expect(container.querySelector('.tenant-hero-backdrop')).toBeNull();
 expect(container.querySelector('.tenant-hero')).not.toHaveAttribute('style');
});
it.each(['javascript:alert(1)','data:image/svg+xml,evil','//outside.example/a.svg','https://user:secret@assets.example/a.svg','/\\\\outside.example/a.svg'])('rejects unsafe decorative URLs: %s',image=>{
 const input=site(image);const {container}=render(<PublicTenantComposableSite site={input}/>);
 expect(container.querySelector('.tenant-hero-backdrop')).toBeNull();
 expect(validateSiteConfig(input.config).errors.some(e=>e.code==='invalid_hero_backdrop')).toBe(true);
});
it.each([{backdropOpacity:-1},{backdropOpacity:101},{backdropOpacity:'12'},{backdropPosition:'outside'},{backdropPosition:['right']}])('validates malformed backdrop settings %j',settings=>{
 expect(validateSiteConfig(site('/graphic.svg',settings).config).errors.some(e=>e.code.startsWith('invalid_hero_backdrop_'))).toBe(true);
});
it('supports a full width background and transparent opacity',()=>{
 const {container}=render(<PublicTenantComposableSite site={site('/graphic.svg',{backdropOpacity:0,backdropPosition:'full'})}/>);
 const image=container.querySelector('.tenant-hero-backdrop') as HTMLImageElement;
 expect(image.style.opacity).toBe('0');expect(image.style.width).toBe('100%');
});

it.each([null,42,{url:'/graphic.svg'}])('rejects non-text backdrop fields %j',backdropImage=>{expect(validateSiteConfig(site(backdropImage).config).errors.some(e=>e.code==='invalid_hero_backdrop')).toBe(true)});

