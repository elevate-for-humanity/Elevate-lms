import test from 'node:test';
import assert from 'node:assert/strict';
import {hasPort,redirectMap,selectFrontend} from './repair-public-http-entry.mjs';
test('HTTP redirect preserves queries and portal hostnames',()=>{
 const map=redirectMap();assert.equal(map.defaultUrlRedirect.httpsRedirect,true);assert.equal(map.defaultUrlRedirect.stripQuery,false);assert.equal(map.defaultUrlRedirect.hostRedirect,undefined);
 assert.equal(map.pathMatchers[0].defaultUrlRedirect.hostRedirect,'www.elevateforhumanity.org');
 assert.equal(map.tests[2].expectedOutputUrl,'https://app.elevateforhumanity.org/login?redirect=%2Flms');
});
test('frontend guard rejects missing reservations or ambiguous public addresses',()=>{
 const map={name:'elevate-public-routes',selfLink:'map',hostRules:[{hosts:['www.elevateforhumanity.org']}]};
 const proxies=[{urlMap:'map',selfLink:'proxy'}],rules=[{target:'proxy',portRange:'443-443',IPAddress:'192.0.2.1',loadBalancingScheme:'EXTERNAL_MANAGED'}];
 assert.deepEqual(selectFrontend(map,proxies,rules,[{name:'reserved',address:'192.0.2.1'}]),{ip:'192.0.2.1',addressName:'reserved',scheme:'EXTERNAL_MANAGED'});
 assert.throws(()=>selectFrontend(map,proxies,rules,[]),/reserved/);
 assert.throws(()=>selectFrontend(map,proxies,[...rules,{...rules[0],IPAddress:'192.0.2.2'}],[]),/one established/);
});
test('port detection keeps HTTP and HTTPS distinct',()=>{assert.equal(hasPort({portRange:'443-443'},80),false);assert.equal(hasPort({ports:['80']},80),true);assert.equal(hasPort({portRange:'80-80'},80),true);});
