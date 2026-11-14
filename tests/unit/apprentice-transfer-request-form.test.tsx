import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const router=vi.hoisted(()=>({push:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>router}));
import Form from '@/apps/lms/app/apprentice/transfer-hours/request/TransferHoursRequestForm';
it('submits actual transfer evidence for the server-selected enrollment',async()=>{
 const fetchMock=vi.fn(async()=>({ok:true,json:async()=>({ok:true})}));vi.stubGlobal('fetch',fetchMock);
 render(<Form enrollmentId="owned-enrollment"/>);
 fireEvent.change(screen.getByLabelText('Previous school or training provider'),{target:{value:'Prior School'}});
 fireEvent.change(screen.getByLabelText('Hours requested'),{target:{value:'80'}});
 fireEvent.change(screen.getByLabelText('Supporting evidence link'),{target:{value:'https://example.org/transcript'}});
 fireEvent.change(screen.getByLabelText('Training and dates'),{target:{value:'Verified school attendance requested for review'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit for review'}));
 await waitFor(()=>expect(router.push).toHaveBeenCalledWith('/apprentice/transfer-hours?submitted=1'));
 const [url,options]=fetchMock.mock.calls[0] as any;
 expect(url).toBe('/api/apprentice/transfer-hours');expect(JSON.parse(options.body)).toMatchObject({enrollment_id:'owned-enrollment',hours_requested:80,previous_school_name:'Prior School'});
 cleanup();vi.unstubAllGlobals();
});
it('keeps the form visible and reports rejected evidence',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'Request already pending'})})));
 render(<Form enrollmentId="owned"/>);
 fireEvent.submit(screen.getByRole('button',{name:'Submit for review'}).closest('form')!);
 expect(await screen.findByRole('alert')).toHaveTextContent('Request already pending');
 cleanup();vi.unstubAllGlobals();
});
