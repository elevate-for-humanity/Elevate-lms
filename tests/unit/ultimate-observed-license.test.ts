import {describe,it,expect} from 'vitest';
import {observedLicenseEvidence} from '@/lib/ultimate-course-builder/adapters/platform-media';
describe('existing Envato license evidence',()=>{
 it('uses an existing item license document without repurchasing',()=>{
  expect(observedLicenseEvidence({license_document_url:'https://example.org/item-license.pdf'})).toBe('https://example.org/item-license.pdf');
 });
 it('retains an observed licensed item with its capture evidence',()=>{
  expect(observedLicenseEvidence({provider_item_id:'item',metadata:{licenseObserved:true,licenseObservedAt:'2026-09-21',licenseTermsUrl:'https://elements.envato.com/license-terms'}})).toBe('https://elements.envato.com/license-terms');
 });
 it('does not manufacture a license from the terms page alone',()=>{
  expect(observedLicenseEvidence({provider_item_id:'item',metadata:{licenseTermsUrl:'https://elements.envato.com/license-terms'}})).toBeUndefined();
 });
});
