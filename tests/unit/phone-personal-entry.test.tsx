import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const auth=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/communications/actor',()=>({requireCommunicationActor:auth}));
vi.mock('@/components/program-holder/ProgramHolderPhone',()=>({ProgramHolderPhone:()=>null}));
import PersonalPhonePage from '@/apps/lms/app/communications/phone/page';
it.each([
 ['program_holder','/program-holder/meetings','/program-holder/email'],
 ['host_shop','/host-shop/dashboard/schedule','/host-shop/dashboard/email'],
 ['staff','/lms/calendar','/communications/email'],
])('preserves %s workspace links outside onboarding gates',async(role,calendar,email)=>{auth.mockResolvedValue({roles:[role]});const result=await PersonalPhonePage();expect(auth).toHaveBeenCalledWith({assignedPhone:true});expect(result.props.calendarHref).toBe(calendar);expect(result.props.emailHref).toBe(email);});
