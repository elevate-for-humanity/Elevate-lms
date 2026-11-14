import test from 'node:test';
import assert from 'node:assert/strict';
import {storeSignInReturnPath} from './sign-in-return.mjs';
test('Store sign-in preserves commerce destinations without an LMS request',()=>{
 assert.equal(storeSignInReturnPath('/store/cart?plan=team'),'/store/cart?plan=team');
 assert.equal(storeSignInReturnPath('https://store.elevateforhumanity.org/store/apps/course-builder'),'/store/apps/course-builder');
});
test('Store sign-in rejects external, credential-bearing and non-commerce redirects',()=>{
 for(const value of [undefined,'https://app.elevateforhumanity.org/admin','//outside.example/store','https://user:password@store.elevateforhumanity.org/store','/store/../admin','/store-other','/api/auth/signout','/store\\outside','javascript:alert(1)'])assert.equal(storeSignInReturnPath(value),'/store');
});

test('all commerce sign-in links target Store and preserve the purchase return', async () => {
 const {storeSignInHref}=await import('./sign-in-return.mjs');
 for(const path of ['/store/cart','/store/plans?purchase=1&plan=pro&interval=annual','/store/apps/legacy83']) {
  const url=new URL(storeSignInHref(path));
  assert.equal(url.origin,'https://store.elevateforhumanity.org');
  assert.equal(url.pathname,'/login');
  assert.equal(url.searchParams.get('redirect'),path);
 }
 assert.equal(new URL(storeSignInHref('https://outside.example/private')).searchParams.get('redirect'),'/store');
});
