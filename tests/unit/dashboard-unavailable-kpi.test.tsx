import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SystemHealthPanel } from '@/components/admin/dashboard/SystemHealthPanel';
import { KpiGrid } from '@/components/admin/dashboard/KpiGrid';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';

describe('failed dashboard metrics', () => {
  it('renders unavailable instead of a financial zero after normalization', () => {
    const data = normalizeAdminDashboardData({kpis:[{label:'Revenue This Month',value:0,delta:0,deltaLabel:'Database aggregate',href:'/payments',unavailable:true}]});
    const html=renderToStaticMarkup(<KpiGrid kpis={data.kpis}/>);
    expect(html).toContain('Unavailable');
    expect(html).toContain('Source query failed; retry to refresh');
    expect(html).not.toContain('$0');
  });
  it('retains a verified zero as a numeric metric', () => {
    const html=renderToStaticMarkup(<KpiGrid kpis={[{label:'Certificates Issued',value:0,delta:0,deltaLabel:'Live certificate count',href:'/certificates'}]}/>);
    expect(html).not.toContain('Unavailable');
    expect(html).toContain('>0<');
  });
});

 it('never renders failed health queries as clear',()=>{
   const health=normalizeAdminDashboardData(null).systemHealth;
   const html=renderToStaticMarkup(<SystemHealthPanel health={health}/>);
   expect(html).toContain('Unavailable');
   expect(html).not.toContain('Clear');
   expect(html).not.toContain('All systems operational');
 });
