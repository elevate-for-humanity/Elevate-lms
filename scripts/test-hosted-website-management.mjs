import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canManageHostedWebsite } from '../lib/websites/can-manage-hosted-website.ts';
function database({owner='owner',organization='legacy',role='admin',membershipRole='org_admin',status='active',membershipOrg='legacy',fail=false}={}) {
 const rows={user_websites:[{id:'site',user_id:owner,organization_id:organization}],profiles:[{id:'actor',role}],organization_users:[{organization_id:membershipOrg,user_id:'actor',role:membershipRole,status}]};
 return {from(table){let filters=[];return {select(){return this},eq(key,value){filters.push([key,value]);return this},async maybeSingle(){return {error:fail?new Error('Unavailable'):null,data:rows[table].find(row=>filters.every(([key,value])=>row[key]===value))||null}}}}};
}
test('actual site owner retains management',async()=>assert.equal(await canManageHostedWebsite(database({owner:'actor'}),'site','actor'),true));
test('assigned platform administrator can manage hosted site',async()=>assert.equal(await canManageHostedWebsite(database(),'site','actor'),true));
test('customer org admin cannot become the hosting administrator',async()=>assert.equal(await canManageHostedWebsite(database({role:'student'}),'site','actor'),false));
test('another business membership grants no access',async()=>assert.equal(await canManageHostedWebsite(database({membershipOrg:'other'}),'site','actor'),false));
test('suspended administrator loses hosted access',async()=>assert.equal(await canManageHostedWebsite(database({status:'suspended'}),'site','actor'),false));
test('report viewer cannot edit',async()=>assert.equal(await canManageHostedWebsite(database({membershipRole:'report_viewer'}),'site','actor'),false));
test('database failures deny access',async()=>assert.equal(await canManageHostedWebsite(database({fail:true}),'site','actor'),false));
test('missing website denies access',async()=>assert.equal(await canManageHostedWebsite(database(),'missing','actor'),false));
