import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({quantity:1}));
vi.mock('@/hooks/useStoreCart',()=>({useStoreCart:()=>({cart:{items:[{product:{id:'p',slug:'current',name:'Workbook',price:90,category:'digital-workbook',image:'/cover.jpg'},quantity:state.quantity}],total:90*state.quantity,itemCount:state.quantity},removeItem:vi.fn(),setQuantity:vi.fn(),refresh:vi.fn()})}));
import StoreCartView from '@/components/store/StoreCartView';
afterEach(()=>{cleanup();vi.unstubAllGlobals();state.quantity=1;});
it('requests JSON from invoice checkout and only reuses attempts for the same visible cart',async()=>{
 const calls:any[]=[];
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{calls.push(init);return {ok:false,status:500,json:async()=>({error:'Test retry'})};}));
 const view=render(<StoreCartView/>);
 const checkout=async(count:number)=>{fireEvent.click(screen.getByRole('button',{name:'Proceed to Checkout'}));await waitFor(()=>expect(calls).toHaveLength(count));await screen.findByText('Test retry');};
 await checkout(1);await checkout(2);
 expect(calls[0].headers.Accept).toBe('application/json');
 const first=JSON.parse(calls[0].body);expect(JSON.parse(calls[1].body).checkoutAttemptId).toBe(first.checkoutAttemptId);
 state.quantity=2;view.rerender(<StoreCartView/>);await checkout(3);
 expect(JSON.parse(calls[2].body).checkoutAttemptId).not.toBe(first.checkoutAttemptId);
 expect(JSON.parse(calls[2].body).items).toEqual([{slug:'current',quantity:2}]);
});
