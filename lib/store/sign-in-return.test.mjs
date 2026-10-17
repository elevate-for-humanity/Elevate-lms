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
