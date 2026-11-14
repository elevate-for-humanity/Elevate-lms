import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,waitFor} from '@testing-library/react';
const h=vi.hoisted(()=>({props:{} as any}));
vi.mock('next/dynamic',()=>({default:()=> (props:any)=>{h.props=props;return null;}}));
vi.mock('@/components/studio/useStudioViewport',()=>({useStudioViewport:()=>({})}));
vi.mock('@/components/communications/CommunicationTodos',()=>({CommunicationTodos:()=>null}));
import StudioBrowserPage from '@/apps/admin/app/studio/browser/page';
afterEach(()=>{cleanup();window.history.replaceState(null,'','/');});
it('opens the subscription library without forcing authentication on an ordinary Admin visit',async()=>{
 window.history.replaceState(null,'','/studio/browser?provider=envato');
 render(<StudioBrowserPage/>);
 await waitFor(()=>expect(h.props).toMatchObject({autoStart:true,initialTarget:'https://app.envato.com/',initialSignIn:false}));
});
it('retains the explicit reconnect route for an operator who requests sign-in',async()=>{
 window.history.replaceState(null,'','/studio/browser?provider=envato&signin=1');
 render(<StudioBrowserPage/>);
 await waitFor(()=>expect(h.props).toMatchObject({autoStart:true,initialTarget:'https://account.envato.com/sign_in',initialSignIn:true}));
});
