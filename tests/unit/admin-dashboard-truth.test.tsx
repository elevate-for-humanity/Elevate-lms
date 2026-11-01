import React from 'react';
import {expect,it,afterEach,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
import {EnrollmentFunnel} from '../../components/admin/dashboard/EnrollmentFunnel';
import {normalizeAdminDashboardData} from '../../lib/admin/normalize-dashboard-data';
afterEach(cleanup);
it('shows actual enrollment rows independently of certificates without manufactured conversion rates',()=>{
 const data:any={enrollmentSummary:{totalRecords:10,available:true},kpis:[
 {label:'Pending Applications',value:100},{label:'Active Enrollments',value:5},{label:'Certificates Issued',value:12}]};
 render(<EnrollmentFunnel data={data}/>);
 expect(screen.getByRole('link',{name:'10 Enrollment records'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'12 Certificates issued'})).toBeInTheDocument();
 expect(screen.queryByText(/17/)).not.toBeInTheDocument();
 expect(screen.getByRole('region')).not.toHaveTextContent('%');
});
it('shows missing enrollment and KPI sources as unavailable rather than zero',()=>{
 render(<EnrollmentFunnel data={{kpis:[]} as any}/>);
 expect(screen.getAllByText('Unavailable')).toHaveLength(4);
});
it('does not invent an unavailable-health alert when the verified alert list is empty',()=>{
 const data=normalizeAdminDashboardData({systemHealth:{quickBooksWebhookOk:true,quickBooksBillingOk:true,buildEnvOk:true,staleJobs:0,degraded:false,missingDocuments:0,missingCertifications:0,unresolvedFlags:0,alerts:[]}});
 expect(data.systemHealth.alerts).toEqual([]);
 expect(data.systemHealth.degraded).toBe(false);
});
it('preserves canonical program slugs used by dashboard management links',()=>{
 const data=normalizeAdminDashboardData({topPrograms:[{id:'p',slug:'barber-apprenticeship',title:'Barber',learners:3,completed:0,completionRate:0}]});
 expect(data.topPrograms[0].slug).toBe('barber-apprenticeship');
});
it('preserves the data source availability on actual enrollment totals',()=>{
 const data=normalizeAdminDashboardData({enrollmentSummary:{totalRecords:10,available:true}});
 expect(data.enrollmentSummary).toEqual({totalRecords:10,available:true});
 expect(normalizeAdminDashboardData({}).enrollmentSummary).toBeUndefined();
});
