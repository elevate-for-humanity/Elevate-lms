import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
vi.mock('next/navigation',()=>({usePathname:()=>'/login'}));
vi.mock('@/components/site/RouteTransition',()=>({RouteTransition:({children}:{children:React.ReactNode})=><>{children}</>}));
vi.mock('@/components/marketing/PublicPathwayLinks',()=>({default:()=> <span>Training pathways</span>}));
import {MarketingChromeBoundary} from '@/components/site/MarketingChromeBoundary';
import StoreFooter from '@/components/store/StoreFooter';

describe('Store chrome on shared authentication pages',()=>{
 it('retains Store chrome while omitting unrelated training navigation and the career assistant',()=>{
  const html=renderToStaticMarkup(<MarketingChromeBoundary storeOnly header={<header>Store header</header>} footer={<StoreFooter/>} paris={<aside>Career assistant</aside>}><main>Store sign in</main></MarketingChromeBoundary>);
  expect(html).toContain('Store header');expect(html).toContain('Store sign in');
  expect(html).not.toContain('Training pathways');expect(html).not.toContain('Career assistant');
  for(const path of ['/privacy','/terms-of-service','/security-and-data-protection'])expect(html).toContain(`href="${path}"`);
 });
 it('preserves the normal Marketing pathways and assistant by default',()=>{
  const html=renderToStaticMarkup(<MarketingChromeBoundary header={null} footer={null} paris={<aside>Career assistant</aside>}><main>Public page</main></MarketingChromeBoundary>);
  expect(html).toContain('Training pathways');expect(html).toContain('Career assistant');
 });
});
