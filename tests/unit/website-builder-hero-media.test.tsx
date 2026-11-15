import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
afterEach(cleanup);
function site(settings: Record<string,unknown>, content: Record<string,unknown> = {}) {
 const config=buildDefaultSiteConfig({organizationName:'Subscriber portrait'});
 config.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',settings,content:{title:'Owner headline',image:'/approved-portrait.webp',imageAlt:'Owner portrait',...content}}]}];
 return {id:'customer',subdomain:'customer',siteName:'Subscriber portrait',organizationId:null,config};
}
describe('explicit subscriber hero media controls',()=>{
 it('honors uncropped fit independently of template CSS and exposes the chosen mobile order',()=>{
  const {container}=render(<PublicTenantComposableSite site={site({imageFit:'contain',imageFrame:'plain',mobileOrder:'copy-first'})}/>);
  expect(screen.getByRole('img',{name:'Owner portrait'})).toHaveStyle({objectFit:'contain'});
  expect(container.querySelector('.tenant-hero')).toHaveAttribute('data-image-frame','plain');
  expect(container.querySelector('.tenant-hero')).toHaveAttribute('data-mobile-order','copy-first');
 });
 it('preserves existing defaults for websites without explicit controls',()=>{
  const {container}=render(<PublicTenantComposableSite site={site({})}/>);
  expect(screen.getByRole('img',{name:'Owner portrait'}).style.objectFit).toBe('');
  expect(container.querySelector('.tenant-hero')).not.toHaveAttribute('data-image-frame');
  expect(container.querySelector('.tenant-hero')).not.toHaveAttribute('data-mobile-order');
 });
 it('does not override the positioning of a saved multi-panel image',()=>{
  render(<PublicTenantComposableSite site={site({imageFit:'contain'},{imageSegment:2})}/>);
  const image=screen.getByRole('img',{name:'Owner portrait'});
  expect(image).toHaveStyle({width:'400%',transform:'translate(-50%, -50%)'});
  expect(image.style.objectFit).toBe('');
 });
 it('ignores unsupported layout values rather than rendering arbitrary style input',()=>{
  const {container}=render(<PublicTenantComposableSite site={site({imageFit:'fill',imageFrame:'url(bad)',mobileOrder:'bad'})}/>);
  expect(screen.getByRole('img',{name:'Owner portrait'}).style.objectFit).toBe('');
  expect(container.querySelector('.tenant-hero')).not.toHaveAttribute('data-image-frame');
  expect(container.querySelector('.tenant-hero')).not.toHaveAttribute('data-mobile-order');
 });
});
