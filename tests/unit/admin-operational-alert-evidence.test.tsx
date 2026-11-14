import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { OperationalAlerts } from '@/components/admin/dashboard/OperationalAlerts';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { APPLICATION_REVIEW_URL } from '@/lib/admin/application-filters';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
afterEach(cleanup);
it('does not assert all-current when empty results lack complete source evidence',()=>{
 render(<OperationalAlerts data={normalizeAdminDashboardData({})}/>);
 expect(screen.getByRole('status')).toHaveTextContent('checks are incomplete');
 expect(screen.queryByText(/all current/)).toBeNull();
});
it('allows a verified empty alert result',()=>{
 const data=normalizeAdminDashboardData({sourceAvailability:{applications:true,wioaDocuments:true,submissions:true,programHolders:true,holderDocuments:true,operationalAlerts:true}});
 render(<OperationalAlerts data={data}/>);
 expect(screen.getByText(/all current/)).toBeInTheDocument();
});
it('keeps loaded alerts visible while warning about partial sources and uses the canonical review filter',()=>{
 const data=normalizeAdminDashboardData({stalledApplications:[{id:'saved',full_name:'Recorded Applicant',status:'submitted',created_at:'2026-01-01'}]});
 render(<OperationalAlerts data={data}/>);
 expect(screen.getByRole('status')).toHaveTextContent('Some alert sources are unavailable');
 expect(screen.getByRole('link',{name:'View all'})).toHaveAttribute('href',APPLICATION_REVIEW_URL);
 expect(screen.getByText('Recorded Applicant')).toBeInTheDocument();
});

import { RecentApplicationsList } from '@/components/admin/dashboard/RecentApplicationsList';
it('does not present an undated application as received today',()=>{
 const data=normalizeAdminDashboardData({recentApplications:[{id:'record',email:'saved@school.org',created_at:'',age_days:0,href:'/applications'} as any]});
 render(<RecentApplicationsList items={data.recentApplications}/>);
 expect(screen.getByText(/Date unavailable/)).toBeInTheDocument();
 expect(screen.queryByText(/today/)).toBeNull();
});
