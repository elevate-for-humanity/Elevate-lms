import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({share:vi.fn()}));
vi.mock('@livekit/components-react',()=>({useLocalParticipant:()=>({localParticipant:{setScreenShareEnabled:mocks.share},isScreenShareEnabled:false})}));
import {MeetingScreenShare} from '@/components/communications/MeetingScreenShare';
let previous:PropertyDescriptor|undefined;
beforeEach(()=>{previous=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getDisplayMedia:vi.fn()}});mocks.share.mockReset().mockResolvedValue(undefined);});
afterEach(()=>{cleanup();if(previous)Object.defineProperty(navigator,'mediaDevices',previous);else Reflect.deleteProperty(navigator,'mediaDevices');});
describe('meeting screen controls',()=>{
 it('invokes actual participant screen capture from a user click',async()=>{render(<MeetingScreenShare/>);const button=screen.getByRole('button',{name:'Share screen'});await waitFor(()=>expect((button as HTMLButtonElement).disabled).toBe(false));fireEvent.click(button);await waitFor(()=>expect(mocks.share).toHaveBeenCalledWith(true));});
 it('preserves a room that forbids screen sharing',()=>{render(<MeetingScreenShare allowed={false}/>);expect((screen.getByRole('button',{name:'Share screen'}) as HTMLButtonElement).disabled).toBe(true);expect(mocks.share).not.toHaveBeenCalled();});
 it('shows permission failures instead of implying a screen is shared',async()=>{mocks.share.mockRejectedValueOnce(new Error('Permission denied'));render(<MeetingScreenShare/>);fireEvent.click(screen.getByRole('button',{name:'Share screen'}));await screen.findByRole('alert');expect(screen.getByRole('alert').textContent).toContain('Screen sharing did not start');});
});
