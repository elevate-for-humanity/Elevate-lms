vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ create:vi.fn(), newCall:vi.fn(), ringStart:vi.fn(() => Promise.resolve('ringing')), ringStop:vi.fn(), audioCleanup:vi.fn(), statusCleanup:vi.fn(), statusHandlers:[] as Array<(status: string) => void>, handlers:{} as Record<string,(value?: any)=>void> }));
vi.mock('@/lib/phone/browser-client',()=>({createPhoneClient:mock.create,phoneDestination:(value:string)=>value}));
vi.mock('@/lib/notifications/push-client',()=>({getPushNotificationClient:vi.fn()}));
vi.mock('@/lib/notifications/audio-unlock',()=>({installAudioUnlock:()=>mock.audioCleanup,startRingtone:mock.ringStart,stopRingtone:mock.ringStop,onRingtoneStatusChange:(listener:(status:string)=>void)=>{mock.statusHandlers.push(listener);return mock.statusCleanup;}}));
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
  mock.ringStart.mockClear();mock.ringStop.mockClear();mock.audioCleanup.mockClear();
  mock.statusCleanup.mockClear();mock.statusHandlers=[];mock.handlers={};disconnectOk=true;let heartbeats=0;
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
  it('keeps the incoming ringtone active across the ringing state render and stops on answer or unmount',async()=>{
    await connected();mock.ringStop.mockClear();
    const call={id:'incoming',state:'ringing',direction:'inbound',playRingtone:vi.fn()};
    await act(async()=>mock.handlers.call({call}));
    expect(mock.ringStart).toHaveBeenCalledOnce();
    expect(call.playRingtone).not.toHaveBeenCalled();
    expect(mock.ringStop).not.toHaveBeenCalled();
    await act(async()=>mock.handlers.call({call:{...call,state:'active'}}));
    expect(mock.ringStop).toHaveBeenCalled();
    mock.ringStop.mockClear();cleanup();
    expect(mock.ringStop).toHaveBeenCalled();
    expect(mock.audioCleanup).toHaveBeenCalledOnce();
    expect(mock.statusCleanup).toHaveBeenCalledOnce();
  });
  it('starts the SIP fallback ringtone when the primary beep cannot start',async()=>{
    await connected();
    mock.ringStart.mockResolvedValueOnce('unavailable');
    const playRingtone=vi.fn();
    await act(async()=>mock.handlers.call({call:{id:'fallback',state:'ringing',direction:'inbound',playRingtone}}));
    await waitFor(()=>expect(playRingtone).toHaveBeenCalled());
  });
  it('shows a tap-anywhere hint while the ring is pending and hides it once the beep starts',async()=>{
    await connected();
    mock.ringStart.mockResolvedValueOnce('pending');
    const stopRingtone=vi.fn();
    const playRingtone=vi.fn();
    await act(async()=>mock.handlers.call({call:{id:'pending-ring',state:'ringing',direction:'inbound',playRingtone,stopRingtone}}));
    await waitFor(()=>expect(playRingtone).toHaveBeenCalled());
    const emitStatus=mock.statusHandlers.at(-1);
    if(!emitStatus)throw new Error('expected a ringtone status listener');
    await act(async()=>{emitStatus('pending');});
    expect(screen.getByText('Tap anywhere to hear the ring.')).toBeTruthy();
    await act(async()=>{emitStatus('ringing');});
    expect(screen.queryByText('Tap anywhere to hear the ring.')).toBeNull();
    expect(stopRingtone).toHaveBeenCalled();
  });
  it('plays the actual inbound ringtone from the Test ring button and stops it on demand',async()=>{
    await connected();
    mock.ringStart.mockClear();
    fireEvent.click(screen.getByRole('button',{name:'Test ring'}));
    await screen.findByRole('button',{name:'Stop test ring'});
    expect(mock.ringStart).toHaveBeenCalled();
    expect(screen.getByText('Test ring playing — you should hear a repeating beep.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Stop test ring'}));
    await screen.findByRole('button',{name:'Test ring'});
    expect(mock.ringStop).toHaveBeenCalled();
    expect(screen.getByText('Test ring stopped.')).toBeTruthy();
  });
  it('stops the test ring automatically after five seconds',async()=>{
    await connected();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button',{name:'Test ring'}));
    await act(async()=>{});
    expect(screen.getByRole('button',{name:'Stop test ring'})).toBeTruthy();
    mock.ringStop.mockClear();
    await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});
    expect(screen.getByRole('button',{name:'Test ring'})).toBeTruthy();
    expect(mock.ringStop).toHaveBeenCalled();
  });
  it('preserves silent mode without starting either incoming ringtone',async()=>{
    vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({...data,extension:{...data.extension,ringMode:'silent'}}));
    await connected();
    const playRingtone=vi.fn();
    await act(async()=>mock.handlers.call({call:{id:'silent',state:'ringing',direction:'inbound',playRingtone}}));
    expect(playRingtone).not.toHaveBeenCalled();
    expect(mock.ringStart).not.toHaveBeenCalled();
  });
  it('stops shared ringing immediately when Ring muted is saved during an incoming call',async()=>{
    await connected();
    const stop=vi.fn();
    await act(async()=>mock.handlers.call({call:{id:'ringing',state:'ringing',direction:'inbound',stopRingtone:stop}}));
    mock.ringStop.mockClear();
    vi.mocked(fetch).mockImplementationOnce(async()=>Response.json({}));
    fireEvent.click(screen.getByRole('button',{name:'Ring muted'}));
    await screen.findByText('Incoming call sound is muted.');
    expect(stop).toHaveBeenCalled();expect(mock.ringStop).toHaveBeenCalled();
  });
  it('stops shared ringing on Answer before the provider reports an active call',async()=>{
    await connected();
    const answer=vi.fn().mockResolvedValue(undefined);
    await act(async()=>mock.handlers.call({call:{id:'answer',state:'ringing',direction:'inbound',stopRingtone:vi.fn(),answer}}));
    mock.ringStop.mockClear();
    fireEvent.click(screen.getByRole('button',{name:'Answer',exact:true}));
    await waitFor(()=>expect(answer).toHaveBeenCalled());
    expect(mock.ringStop).toHaveBeenCalled();
  });
  it('keeps the administrator text and email actions on their actual portal routes',async()=>{
    render(<ProgramHolderPhone textsHref="/phone/texts" emailHref="/phone/email"/>);
    await screen.findByRole('button',{name:'Disconnect'});
    expect(screen.getByRole('link',{name:'Text messages'}).getAttribute('href')).toBe('/phone/texts');
    expect(screen.getByRole('link',{name:'Interoffice email'}).getAttribute('href')).toBe('/phone/email');
    expect(screen.getByRole('link',{name:'Ringer & alerts'}).getAttribute('href')).toBe('#incoming-call-alert-mode');
    expect(screen.getByLabelText('Incoming call alert mode').id).toBe('incoming-call-alert-mode');
  });
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

it('keeps a token API failure offline, shows its specific cause, and retries only on request', async () => {
  let tokenAttempts = 0;
  mock.create.mockClear();
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method) return Response.json(data);
    if (init.method === 'POST') {
      tokenAttempts += 1;
      return Response.json({ code: 'PHONE_CONTROL_AUTH_FAILED', error: 'The dashboard could not authenticate with the phone provisioning service.' }, { status: 502 });
    }
    return Response.json({});
  }));
  render(<ProgramHolderPhone />);
  await screen.findByText('The dashboard could not authenticate with the phone provisioning service.');
  expect(screen.getByText('Phone offline')).toBeTruthy();
  expect(mock.create).not.toHaveBeenCalled();
  expect(tokenAttempts).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Connect phone' }));
  await waitFor(() => expect(tokenAttempts).toBe(2));
  await screen.findByText('The dashboard could not authenticate with the phone provisioning service.');
  expect(mock.create).not.toHaveBeenCalled();
});
