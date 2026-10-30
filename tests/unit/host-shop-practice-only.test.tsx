import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CompetencyManager from '@/apps/lms/app/host-shop/dashboard/competencies/CompetencyManager.client';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps unbound apprentices visible without claiming zero RTI or a final wage step',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({apprentices:[{
  enrollmentId:'enrollment',studentId:'student',programSlug:'cosmetology-apprenticeship',name:'Apprentice',email:'',practiceOnly:true,completedCompetencies:0,competencyRecords:[],standard:{occupationTitle:'Hair Stylist',rapidsCode:'',onetSocCode:'',competencyCount:0,relatedInstructionHours:0,probationaryHours:0,wageMilestones:[],competencies:[]},
 }]})})));
 render(<CompetencyManager/>);
 await screen.findByRole('heading',{name:'Practical Training Progress'});
 expect(screen.getByText('Sponsor setup required')).toBeInTheDocument();
 expect(screen.queryByText('Final Appendix A wage step reached')).not.toBeInTheDocument();
 expect(screen.queryByText('0 RTI hours required')).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Open Practical Service Log'})).toHaveAttribute('href','/host-shop/dashboard/practical-log');
});
