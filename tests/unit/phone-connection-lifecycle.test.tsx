vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ create:vi.fn(), newCall:vi.fn(), handlers:{} as Record<string,(value?: any)=>void> }));
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
  mock.newCall.mockResolvedValue({id:'outbound-call'});
  mock.create.mockResolvedValue({on:(event:string,callback:any)=>{mock.handlers[event]=callback;},
    newCall:mock.newCall,connect:async()=>{mock.handlers.ready();},disconnect:vi.fn().mockResolvedValue(undefined)});
  vi.stubGlobal('fetch',vi.fn(async(_url:string,init?:RequestInit)=>{
    if(!init?.method)return Response.json(data);
    if(init.method==='POST')return Response.json({provider:'asterisk'});
    const body=JSON.parse(String(init.body));
    if(body.action==='disconnect')return Response.json({}, {status:disconnectOk?200:503});
    if(++heartbeats===1)return Response.json({});
    return new Promise<Response>(resolve=>{laterHeartbeat=resolve;});
  }));
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
async function connected(){render(<ProgramHolderPhone/>);await screen.findByRole('button',{name:'Disconnect'});}
describe('phone connection lifecycle',()=>{
  function pendingProvider() {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    mock.create.mockResolvedValue({on:(event:string,callback:any)=>{mock.handlers[event]=callback;},
      newCall:mock.newCall,connect:()=>new Promise(()=>{}),disconnect});
    return disconnect;
  }
  it('allows retry when the provider goes offline before registration finishes',async()=>{
    pendingProvider();render(<ProgramHolderPhone/>);
    await waitFor(()=>expect(mock.handlers.offline).toBeTypeOf('function'));
    await act(async()=>mock.handlers.offline());
    expect(screen.getByRole('button',{name:'Connect phone'})).toBeEnabled();
    expect(screen.queryByRole('button',{name:'Connecting…'})).toBeNull();
  });
  it('allows retry and displays a provider error before registration finishes',async()=>{
    pendingProvider();render(<ProgramHolderPhone/>);
    await waitFor(()=>expect(mock.handlers.error).toBeTypeOf('function'));
    await act(async()=>mock.handlers.error({message:'SIP registration rejected.'}));
    expect(screen.getByText('SIP registration rejected.')).toBeTruthy();
    expect(screen.getByRole('button',{name:'Connect phone'})).toBeEnabled();
  });
  it('expires a stuck startup, cancels its work and releases the provider for retry',async()=>{
    vi.useFakeTimers();const disconnect=pendingProvider();render(<ProgramHolderPhone/>);
    await vi.waitFor(()=>expect(mock.handlers.error).toBeTypeOf('function'));
    const options=mock.create.mock.calls.at(-1)?.[2];
    expect(options.signal.aborted).toBe(false);
    await act(async()=>{await vi.advanceTimersByTimeAsync(45_000);});
    expect(options.signal.aborted).toBe(true);
    expect(disconnect).toHaveBeenCalled();
    expect(screen.getByText('Phone connection timed out. Reconnect the phone and check microphone access.')).toBeTruthy();
    expect(screen.getByRole('button',{name:'Connect phone'})).toBeEnabled();
  });
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
    expect(fetchMock).toHaveBeenCalledWith('/api/program-holder/phone',expect.objectContaining({method:'PATCH',body:JSON.stringify({action:'ring_mode',ringMode:'silent'})}));
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

describe('dial pad call behavior',()=>{
 it('sends keypad digits to the active call rather than editing the destination',async()=>{
  await connected();
  const dtmf=vi.fn().mockResolvedValue(undefined);
  await act(async()=>mock.handlers.call({call:{id:'active-call',state:'active',direction:'outbound',dtmf}}));
  fireEvent.click(screen.getByRole('button',{name:'9',exact:true}));
  await waitFor(()=>expect(dtmf).toHaveBeenCalledWith('9'));
  expect((screen.getByLabelText('Phone number or extension') as HTMLInputElement).value).toBe('');
 });
 it('calls the verified SIP identity returned for a staff extension',async()=>{
  vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({...data,extension:{...data.extension,provider:'telnyx'}}));
  await connected();
  vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({destination:'sip:verified_phone@sip.telnyx.com'}));
  fireEvent.change(screen.getByLabelText('Phone number or extension'),{target:{value:'101'}});
  fireEvent.click(screen.getByRole('button',{name:'Call',exact:true}));
  await waitFor(()=>expect(mock.newCall).toHaveBeenCalledWith(expect.objectContaining({destinationNumber:'sip:verified_phone@sip.telnyx.com'})));
 });
});

it('shows a connected owner device in admin preview without opening a second phone connection',async()=>{
 mock.create.mockClear();
 vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({...data,readOnly:true,extension:{...data.extension,presenceStatus:'available'}}));
 render(<ProgramHolderPhone/>);
 expect(await screen.findByText("Online on owner's device")).toBeTruthy();
 expect(screen.getByRole('button',{name:'Connect phone'})).toBeDisabled();
 expect(mock.create).not.toHaveBeenCalled();
});
