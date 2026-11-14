import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {OpenPortalPreviewButton} from '@/components/admin/OpenPortalPreviewButton';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('bounds the handoff request and allows retry after a timeout',async()=>{
 const signal=new AbortController().signal;
 const timeout=vi.spyOn(AbortSignal,'timeout').mockReturnValue(signal);
 const request=vi.fn().mockRejectedValue(new DOMException('Timed out','TimeoutError'));
 vi.stubGlobal('fetch',request);
 render(<OpenPortalPreviewButton targetUserId="owner" label="Open dashboard" reason="Audit" hostShopPartnerId="shop"/>);
 fireEvent.click(screen.getByRole('button',{name:'Open dashboard'}));
 await waitFor(()=>expect(screen.getByText(/request took too long/)).toBeInTheDocument());
 expect(timeout).toHaveBeenCalledWith(15000);
 expect(request).toHaveBeenCalledWith('/api/admin/impersonate',expect.objectContaining({signal,method:'POST'}));
 expect(screen.getByRole('button',{name:'Open dashboard'})).toBeEnabled();
});
