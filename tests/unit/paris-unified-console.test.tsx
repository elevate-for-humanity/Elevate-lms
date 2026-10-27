import {beforeEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
vi.mock('next/image',()=>({default:()=>null}));
vi.mock('next/link',()=>({default:({children}:{children:React.ReactNode})=>children}));
vi.mock('@/components/voice/useNaturalVoice',()=>({useNaturalVoice:()=>({play:vi.fn(),stop:vi.fn(),error:null})}));
import AITeamConsole from '@/components/platform/AITeamConsole';
beforeEach(()=>{cleanup();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({response:'Recorded reply'})}));});
it('keeps one conversation when a request moves from instruction to operations',async()=>{
 render(<AITeamConsole unified title="PARIS" />);
 expect(screen.queryByText('ELLIE')).toBeNull();
 expect(screen.queryByText('LIZZY')).toBeNull();
 expect(screen.queryByText('ZORA')).toBeNull();
 const input=screen.getByPlaceholderText('Ask PARIS…');
 fireEvent.change(input,{target:{value:'Explain the lesson'}});fireEvent.click(screen.getByText('Send'));
 await screen.findByText('Recorded reply');
 fireEvent.change(input,{target:{value:'Review the operations workflow'}});fireEvent.click(screen.getByText('Send'));
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
 const body=JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string);
 expect(body.unified).toBe(true);
 expect(body.history).toEqual([{role:'user',content:'Explain the lesson'},{role:'assistant',content:'Recorded reply'}]);
});
it('preserves the separate commercial Store product console',()=>{
 render(<AITeamConsole />);
 expect(screen.getByText('ELLIE')).toBeTruthy();
 expect(screen.getByText('LIZZY')).toBeTruthy();
 expect(screen.getByText('ZORA')).toBeTruthy();
});
