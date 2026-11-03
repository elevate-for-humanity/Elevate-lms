import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CertificationConsole from '../../../apps/admin/app/proctor-portal/certification/CertificationConsole';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const data=(canManage:boolean)=>({authority:{status:'pending'},banks:[],proctors:[],attempts:[],sessions:[],canManage});
describe('certification console gates',()=>{
 it('keeps official delivery and question-bank imports disabled while approval is pending',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({data:data(true)})})));
  render(<CertificationConsole/>);
  await screen.findByText(/Independent EPA certification approval pending/);
  expect(screen.getByRole('button',{name:'Start exam'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Import official bank'})).toBeDisabled();
  expect(screen.getByLabelText('Proctor email')).toHaveAttribute('type','email');
 });
 it('does not present administrative registration or bank import to outside proctors',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({data:data(false)})})));
  render(<CertificationConsole/>);
  await screen.findByText(/Independent EPA certification approval pending/);
  expect(screen.queryByRole('button',{name:'Save proctor'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Import official bank'})).not.toBeInTheDocument();
 });
 it('shows an unavailable registry instead of falsely indicating readiness',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'Registry unavailable'})})));
  render(<CertificationConsole/>);
  expect(await screen.findByRole('status')).toHaveTextContent('Registry unavailable');
  expect(screen.getByRole('button',{name:'Start exam'})).toBeDisabled();
 });
});
