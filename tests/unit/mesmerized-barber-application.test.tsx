import { expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
const mock=vi.hoisted(()=>({reads:vi.fn(),mail:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{mock.reads();const q:any={select:()=>q,eq:()=>q,gte:()=>q,maybeSingle:async()=>({data:{id:'existing'},error:null})};return q;}})}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/email/sendgrid',()=>({sendEmail:mock.mail}));
import { POST } from '@/apps/marketing/app/api/schools/mesmerized-by-beauty/apply/route';
import Form from '@/apps/marketing/app/schools/mesmerized-by-beauty/MesmerizedApplyForm';
it('offers the approved barber program in the actual school application form',()=>{
 render(<Form/>);expect(screen.getByRole('option',{name:'Barber Apprenticeship'})).toHaveValue('barber-apprenticeship');cleanup();
});
it('accepts barber program selection and still respects duplicate protection without sending mail',async()=>{
 mock.reads.mockClear();mock.mail.mockClear();
 const response=await POST(new Request('http://localhost/api/schools/mesmerized-by-beauty/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:'Test',lastName:'Applicant',email:'test@example.org',phone:'3175550100',programInterest:'barber-apprenticeship'})}) as any);
 expect(response.status).toBe(409);expect(mock.reads).toHaveBeenCalledOnce();expect(mock.mail).not.toHaveBeenCalled();
});
