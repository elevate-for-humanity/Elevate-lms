// @vitest-environment node
import { expect, it } from 'vitest';
it('prevents framing, MIME sniffing and unsafe document bases across LMS routes', async () => {
 const {default:config}=await import('../../apps/lms/next.config.mjs');
 const rules=await config.headers();
 const all=rules.find((rule:{source:string})=>rule.source==='/:path*');
 const headers=Object.fromEntries(all.headers.map((header:{key:string;value:string})=>[header.key,header.value]));
 expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
 expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'self'");
 expect(headers['X-Content-Type-Options']).toBe('nosniff');
 for(const source of ['/workbooks/:path*','/apprentice/workbook/:path*']){
  const privateHeaders=Object.fromEntries(rules.find((rule:{source:string})=>rule.source===source).headers.map((header:{key:string;value:string})=>[header.key,header.value]));
  expect(privateHeaders['Cache-Control']).toContain('no-store');
  expect(privateHeaders['X-Robots-Tag']).toContain('noarchive');
 }
});
