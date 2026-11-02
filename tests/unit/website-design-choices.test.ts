import { describe,it,expect } from 'vitest';
import { applyWebsiteDesign, readWebsiteDesign, websiteCatalog } from '@/lib/website-builder/design-choices';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
describe('saved website design choices',()=>{
 it('applies the chosen layout and speaker while preserving business content and images',()=>{
  const original=buildDefaultSiteConfig({organizationName:'Test store'});
  original.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',content:{title:'Real headline',text:'Real business details',image:'/real-owner-photo.jpg'}}]}];
  const result=applyWebsiteDesign(original,{template:'retail',layout:'cover',speaker:'deep',density:'compact',narration:true});
  expect(result.pages![0].sections[0].settings?.layout).toBe('cover');
  expect(result.pages![0].sections[0].content).toMatchObject({image:'/real-owner-photo.jpg',title:'Real headline',narrator:'deep',narration:'Real headline. Real business details'});
  expect(original.pages[0].sections[0].settings).toBeUndefined();
  expect(result.branding).toEqual(original.branding);
  expect(result.meta?.designPreferences).toMatchObject({template:'retail',speaker:'deep'});
 });
 it('respects narration opt-out and explicitly applies colors only when requested',()=>{
  const config=buildDefaultSiteConfig({organizationName:'Test'});
  const result=applyWebsiteDesign(config,{template:'botanical',narration:false},{applyPalette:true});
  expect(result.branding.primaryColor).toBe('#24392c');
  expect(result.pages!.flatMap(p=>p.sections).filter(s=>s.type==='hero').every(s=>!s.content.narration)).toBe(true);
  expect(readWebsiteDesign({template:'unknown',speaker:'javascript:bad',layout:'bad'})).toMatchObject({template:'executive',speaker:'warm',layout:'split'});
 });
 it('exposes generated product sections to the same cart without inventing prices or duplicating products',()=>{
  const config=buildDefaultSiteConfig({organizationName:'Test'});
  config.products=[{name:'Owner catalog item',href:'/product',price:'12.00'}];
  config.pages=[{id:'shop',slug:'/shop',title:'Shop',sections:[{id:'products',type:'products',content:{items:[{name:'Repeated item',href:'/product',price:'999.00'},{name:'Quote item',href:'/quote'}]}}]}];
  expect(websiteCatalog(config)).toEqual([{name:'Owner catalog item',href:'/product',price:'12.00'},{name:'Quote item',href:'/quote',price:undefined,description:undefined,image:undefined}]);
 });
});
