import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ create:vi.fn(), handlers:{} as Record<string,(value?: any)=>void> }));
vi.mock('@/lib/phone/browser-client',()=>({createPhoneClient:mock.create,phoneDestination:(value:string)=>value}));
vi.mock('@/lib/notifications/push-client',()=>({getPushNotificationClient:vi.fn()}));
vi.mock('@/components/program-holder/ProgramHolderPhoneIntroduction',()=>({ProgramHolderPhoneIntroduction:()=>null}));
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';
const data={readOnly:false,phoneNumber:'',system:{name:'Isolated fixture',timezone:'UTC',status:'active'},
  notifications:{emailMissedCalls:false,smsMissedCalls:false,smsPhone:''},
  extension:{id:'extension',extension:'101',displayName:'Test fixture',department:null,ringMode:'ring',
    availabilitySource:'manual',schedule:{},ringSeconds:20,voicemailGreeting:'',externalFallbackEnabled:false,
    externalFallbackNumber:'',presenceStatus:'offline',provider:'asterisk'},inbox:[]};
let laterHeartbeat:(response:Response)=>void;
let disconnectOk:boolean;
beforeEach(()=>{
  mock.handlers={};disconnectOk=true;let heartbeats=0;
  mock.create.mockResolvedValue({on:(event:string,callback:any)=>{mock.handlers[event]=callback;},
    connect:async()=>{mock.handlers.ready();},disconnect:vi.fn().mockResolvedValue(undefined)});
  vi.stubGlobal('fetch',vi.fn(async(_url:string,init?:RequestInit)=>{
    if(!init?.method)return Response.json(data);
    if(init.method==='POST')return Response.json({provider:'asterisk'});
    const body=JSON.parse(String(init.body));
    if(body.action==='disconnect')return Response.json({}, {status:disconnectOk?200:503});
    if(++heartbeats===1)return Response.json({});
    return new Promise<Response>(resolve=>{laterHeartbeat=resolve;});
  }));
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
async function connected(){render(<ProgramHolderPhone/>);await screen.findByRole('button',{name:'Disconnect'});}
describe('phone connection lifecycle',()=>{
  it('renders the actual voicemail audio returned by the API',async()=>{
    vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({...data,readOnly:true,voicemail:{items:[{id:'message',phone_number:null,created_at:'2026-10-12T12:00:00Z',transcription:'Saved voice message',summary:null,recordingUrl:'/api/program-holder/phone/voicemail/message/recording'}]}}));
    render(<ProgramHolderPhone/>);
    await screen.findByText('Saved voice message');
    expect(screen.getByLabelText('Play voicemail or call recording').getAttribute('src')).toBe('/api/program-holder/phone/voicemail/message/recording');
  });
  it('opens to the dial pad before availability settings',async()=>{
    await connected();
    const dial=screen.getByRole('heading',{name:'Dial pad'});const settings=screen.getByRole('heading',{name:'Availability and ringing'});
    expect(Boolean(dial.compareDocumentPosition(settings)&Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(screen.getByRole('button',{name:'Ring on'}).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button',{name:'Vibrate'})).toBeTruthy();
  });
  it('saves ring mode through the real phone settings API',async()=>{
    await connected();
    const fetchMock=vi.mocked(fetch);fetchMock.mockImplementationOnce(async()=>Response.json({}));
    fireEvent.click(screen.getByRole('button',{name:'Ring muted'}));
    await screen.findByText('Incoming call sound is muted.');
    expect(fetchMock).toHaveBeenCalledWith('/api/program-holder/phone',expect.objectContaining({method:'PATCH',body:JSON.stringify({ringMode:'silent'})}));
    expect(screen.getByRole('button',{name:'Ring muted'}).getAttribute('aria-pressed')).toBe('true');
  });
  it('clears online messaging and cannot be reconnected by a late heartbeat after disconnect',async()=>{
    await connected();
    await act(async()=>{mock.handlers.ready();});
    fireEvent.click(screen.getByRole('button',{name:'Disconnect'}));
    await screen.findByText('Phone disconnected.');
    await act(async()=>{laterHeartbeat(Response.json({}));});
    expect(screen.getByRole('button',{name:'Connect phone'})).toBeTruthy();
    expect(screen.queryByText('Phone registration and reachability verified.')).toBeNull();
  });
  it('does not promote a closed provider connection using an earlier heartbeat response',async()=>{
    await connected();
    await act(async()=>{mock.handlers.ready();mock.handlers.offline();});
    await act(async()=>{laterHeartbeat(Response.json({}));});
    expect(screen.getByText('Phone is offline.')).toBeTruthy();
    expect(screen.queryByRole('button',{name:'Disconnect'})).toBeNull();
  });
  it('distinguishes local disconnect from a failed server presence update',async()=>{
    await connected();disconnectOk=false;
    fireEvent.click(screen.getByRole('button',{name:'Disconnect'}));
    await waitFor(()=>expect(screen.getByText('Phone disconnected locally. Server presence could not yet be confirmed.')).toBeTruthy());
    expect(screen.getByRole('button',{name:'Connect phone'})).toBeTruthy();
  });
});
