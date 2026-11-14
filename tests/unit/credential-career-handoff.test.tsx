import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const refresh=vi.hoisted(()=>vi.fn());
vi.mock('next/navigation',()=>({useRouter:()=>({refresh})}));
import { CredentialUploadForm } from '@/components/lms/CredentialUploadForm';
afterEach(()=>{cleanup();vi.unstubAllGlobals();refresh.mockClear();});
it('links a successful credential submission to jobs, resume, and dashboard without claiming verification',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({upload:{verification_status:'pending'}})}));
  const {container}=render(<CredentialUploadForm programs={[{id:'program',label:'HVAC'}]} credentials={[{id:'credential',label:'EPA 608'}]}/>);
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(()=>expect(screen.getByRole('link',{name:'See matching jobs'})).toHaveAttribute('href','/lms/career'));
  expect(screen.getByRole('link',{name:'Update my résumé'})).toHaveAttribute('href','/lms/resume-builder');
  expect(screen.getByRole('link',{name:'Back to dashboard'})).toHaveAttribute('href','/lms/dashboard');
  expect(screen.getByText(/Verification is required before/)).toBeInTheDocument();
  expect(refresh).toHaveBeenCalledOnce();
});
it('keeps upload failure visible and does not show a successful handoff',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Upload unavailable'})}));
  const {container}=render(<CredentialUploadForm programs={[{id:'program',label:'HVAC'}]} credentials={[]}/>);
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Upload unavailable'));
  expect(screen.queryByRole('link',{name:'See matching jobs'})).toBeNull();
});
