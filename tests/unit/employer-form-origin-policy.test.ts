import {expect,it} from 'vitest';
import config from '../../apps/lms/next.config.mjs';

it('preserves same-origin employer form POSTs without leaking referrers cross-origin',async()=>{
 const headers=await config.headers();
 const policy=headers.find(rule=>rule.source==='/employer/:path*');
 expect(policy?.headers).toContainEqual({key:'Referrer-Policy',value:'same-origin'});
 const defaultIndex=headers.findIndex(rule=>rule.headers.some(header=>header.key==='Referrer-Policy'&&header.value==='no-referrer'));
 expect(headers.indexOf(policy!)).toBeGreaterThan(defaultIndex);
 // The recovery callback retains its separately owned security policy.
 expect(headers.filter(rule=>rule.source==='/employer/:path*')).toHaveLength(1);
});
