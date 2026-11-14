import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProgramHolderOnlineStudy } from '@/components/program-holder/ProgramHolderOnlineStudy';

it('shows open, pending and verified clocks without treating elapsed or pending time as approved hours', () => {
  const html = renderToStaticMarkup(<ProgramHolderOnlineStudy enrollments={[{id:'e',full_name:'Learner'}]} sessions={[
    {id:'open',enrollment_id:'e',clock_in_at:'2026-10-27T10:00:00Z',clock_out_at:null},
    {id:'pending',enrollment_id:'e',clock_in_at:'2026-10-27T10:00:00Z',clock_out_at:'2026-10-27T11:00:00Z',attendance_hours:{hours_logged:99,verified:false}},
    {id:'verified',enrollment_id:'e',clock_in_at:'2026-10-27T10:00:00Z',clock_out_at:'2026-10-27T11:00:00Z',attendance_hours:{hours_logged:1,verified:true}},
  ]} />);
  expect(html).toContain('Still clocked in');expect(html).toContain('Pending staff verification');
  expect(html).toContain('Verified by staff');expect(html).toContain('1.00');expect(html).not.toContain('99.00');
});
