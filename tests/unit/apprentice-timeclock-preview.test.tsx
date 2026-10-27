import { expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
const router=vi.hoisted(()=>({push:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>router}));
vi.mock('@/components/timeclock/TimeclockAttendanceNotice',()=>({TimeclockAttendanceNotice:()=>null}));
vi.mock('@/lib/pwa/offline-queue',()=>({offlineQueue:{add:vi.fn()}}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>({})}));
import Page from '@/apps/lms/app/apprentice/timeclock/page';
it('never requests GPS or sends attendance mutations while previewing an open learner shift',async()=>{
 const gps=vi.fn();Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:gps}});
 const fetchMock=vi.fn(async()=>({ok:true,json:async()=>({programName:'Barber',previewing:true,canClock:false,
  defaultSiteId:'site',allowedSites:[],hoursCompleted:0,hoursRequired:2000,weeklyOjlHours:0,
  activeShift:{entryId:'shift',clockInAt:'2026-10-27T09:00:00Z',lunchStartAt:null,lunchEndAt:null,siteId:'site'}})}));
 vi.stubGlobal('fetch',fetchMock);
 render(<Page/>);await screen.findByRole('heading',{name:'Timeclock'});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Clock Out'})).toBeDisabled());
 expect(screen.getByRole('button',{name:'Start Lunch'})).toBeDisabled();
 expect(gps).not.toHaveBeenCalled();expect(fetchMock).toHaveBeenCalledTimes(1);
 cleanup();vi.unstubAllGlobals();
});
