import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { appOrigin } from './helpers/app-origins';

// This suite deliberately targets the serving production LMS, not a local mocked route.
const BASE = appOrigin('lms');
const fields = [
  'phone','apprentice_phone','apprentice_notes','shop_notes','admin_notes',
  'message','application','intake','financial','date_of_birth','government_id',
  'placement','address','host_shop_id','apprentice_id',
];
type Shop = { email:string; password:string; studentEmail:string; matchId:string };
function configured(): [Shop,Shop] {
  const a:Shop={email:process.env.QA_SHOP_A_EMAIL||'',password:process.env.QA_SHOP_A_PASSWORD||'',
    studentEmail:process.env.QA_SHOP_A_STUDENT_EMAIL||'',matchId:process.env.QA_SHOP_A_MATCH_ID||''};
  const b:Shop={email:process.env.QA_SHOP_B_EMAIL||'',password:process.env.QA_SHOP_B_PASSWORD||'',
    studentEmail:process.env.QA_SHOP_B_STUDENT_EMAIL||'',matchId:process.env.QA_SHOP_B_MATCH_ID||''};
  for(const [name,s] of [['A',a],['B',b]] as const)
    expect(Object.values(s).every(Boolean), 'Missing disposable Shop '+name+' identity').toBe(true);
  expect(a.email).not.toBe(b.email);
  expect(a.matchId).not.toBe(b.matchId);
  return [a,b];
}
async function signIn(browser:Browser,shop:Shop):Promise<{context:BrowserContext;page:Page}> {
  const context=await browser.newContext({serviceWorkers:'block'});
  const page=await context.newPage();
  const res=await page.goto(BASE+'/login',{waitUntil:'domcontentloaded'});
  expect(res?.status()).toBeLessThan(500);
  const email=page.locator('input[type="email"],input[name="email"]').first();
  const password=page.locator('input[type="password"]').first();
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await email.fill(shop.email);
  await password.fill(shop.password);
  await page.locator('button[type="submit"]').first().click();
  await expect.poll(()=>new URL(page.url()).pathname,{timeout:60_000}).not.toMatch(/\/login(?:\/|$)/);
  await expect(page.locator('[data-elevate-dashboard-content]:visible')).toBeVisible({timeout:30_000});
  return {context,page};
}
function assertMinimal(record:any,expectedId:string,studentEmail:string) {
  expect(record).toBeTruthy();
  expect(record.id).toBe(expectedId);
  expect(record.apprentice?.email).toBe(studentEmail);
  expect(record.program_slug).toBe('barber-apprenticeship');
  expect(Object.keys(record).sort()).toEqual(['apprentice','created_at','id','program_slug','status']);
  expect(Object.keys(record.apprentice).sort()).toEqual(['email','full_name']);
  const serialized=JSON.stringify(record);
  for (const field of fields) expect(serialized).not.toContain('"'+field+'"');
  expect(serialized).not.toContain('Sensitive fixture');
}
test('separate approved Host Shop identities cannot read or mutate the other shop',async({browser})=>{
  expect(BASE).toBe('https://lms.elevateforhumanity.org');
  const shops=configured();
  for (let i=0;i<2;i++){
    const own=shops[i],other=shops[1-i];
    const {context,page}=await signIn(browser,own);
    try {
      const roster=await page.goto(BASE+'/host-shop/dashboard/apprentices',{waitUntil:'domcontentloaded'});
      expect(roster?.status()).toBe(200);
      await expect(page.locator('main')).toContainText(own.studentEmail,{timeout:20_000});
      await expect(page.locator('main')).not.toContainText(other.studentEmail);
      const list=await page.request.get(BASE+'/api/host-shop/match-requests?status=all',{failOnStatusCode:false});
      expect(list.status()).toBe(200);
      const data=await list.json();
      expect(Array.isArray(data.requests)).toBe(true);
      const ownRow=data.requests.find((x:any)=>x.id===own.matchId);
      assertMinimal(ownRow,own.matchId,own.studentEmail);
      expect(data.requests.some((x:any)=>x.id===other.matchId)).toBe(false);
      const detail=await page.request.get(BASE+'/api/host-shop/match-requests/'+own.matchId,{failOnStatusCode:false});
      expect(detail.status()).toBe(200);
      assertMinimal((await detail.json()).request,own.matchId,own.studentEmail);
      const forbidden=await page.request.get(BASE+'/api/host-shop/match-requests/'+other.matchId,{failOnStatusCode:false});
      expect([403,404]).toContain(forbidden.status());
      const mutation=await page.request.patch(BASE+'/api/host-shop/match-requests/'+other.matchId,{
        data:{status:'approved',shop_notes:'QA unauthorized update - must not persist'},failOnStatusCode:false});
      expect([403,404]).toContain(mutation.status());
      // Status must remain pending after a forbidden cross-shop mutation.
      const verify=await page.request.get(BASE+'/api/host-shop/match-requests/'+own.matchId,{failOnStatusCode:false});
      expect(verify.status()).toBe(200);
      expect((await verify.json()).request.status).toBe('pending');
      await page.screenshot({path:test.info().outputPath('host-shop-'+i+'-roster.png')});
    } finally {await context.close();}
  }
});
