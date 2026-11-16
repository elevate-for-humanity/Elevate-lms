import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({actor:null as any,notify:vi.fn(),writes:[] as string[],transcript:'',failWrite:false,foreign:false,missingExtension:false,failTable:''}));
vi.mock('@/lib/phone/actor-response',()=>({phoneActorResponse:async()=>({actor:h.actor})}));
vi.mock('@/lib/phone/recordings',()=>({loadPhoneRecording:async()=>new Response(new Uint8Array([1,2,3]))}));
vi.mock('@/lib/phone/speech-audio',()=>({phoneSpeechChunks:async()=>[Buffer.from('wav')]}));
vi.mock('@/lib/phone/message-notifications',()=>({notifyAssignee:h.notify}));
import {transcribePhoneMessage} from '@/lib/phone/transcript-api';
const id='11111111-1111-4111-a111-111111111111';
const invoke=(kind='voicemail')=>transcribePhoneMessage(new Request('https://phone.test'),{params:Promise.resolve({kind,id})});
beforeEach(()=>{
 vi.clearAllMocks();h.notify.mockReset();h.transcript='';h.writes=[];h.failWrite=false;h.foreign=false;h.missingExtension=false;h.failTable='';
 h.actor={previewing:false,user:{id:'owner'},system:{id:'system'},roles:['staff'],db:{from:(table:string)=>{
  let update:any;const eqs:any[]=[];
  const q:any={select:()=>q,eq:(key:string,value:any)=>{eqs.push([key,value]);return q;},update:(value:any)=>{update=value;return q;},maybeSingle:async()=>{
   if(table==='communication_extensions')return {data:{extension:'101'},error:null};
   if(table==='phone_callback_tasks'&&eqs.some(([k])=>k==='call_id'))return {data:{id:'paired-task',assigned_profile_id:h.foreign?'other':'owner',extension_id:h.missingExtension?null:'extension',callback_number:'+13175550100'},error:null};
   return {data:{recording_url:'supabase://phone-voicemails/test.wav',call_id:'call',assigned_profile_id:'owner',extension_id:'extension',source:'voicemail',transcription:h.transcript},error:null};
  },then:(resolve:any)=>{h.writes.push(table);if(!h.failWrite&&update?.transcription)h.transcript=update.transcription;return Promise.resolve({error:h.failWrite||table===h.failTable?{message:'failure'}:null}).then(resolve);}};return q;
 }}};
 vi.stubGlobal('fetch',vi.fn(async(url:any)=>String(url).includes('metadata.google.internal')?Response.json({access_token:'fixture'},{headers:{'Metadata-Flavor':'Google'}}):Response.json({results:[{alternatives:[{transcript:'Please call about enrollment.'}]}]})));
});
it('stores a recovered transcript before notifying the canonical task with its extension',async()=>{
 h.notify.mockImplementation(async()=>{expect(h.writes).toEqual(['voicemails','phone_callback_tasks']);});
 expect((await invoke()).status).toBe(200);
 expect(h.notify).toHaveBeenCalledWith(h.actor.db,expect.objectContaining({taskId:'paired-task',profileId:'owner',extension:'101',source:'voicemail',transcript:'Please call about enrollment.'}),h.actor.system);
});
it('retries unclaimed notifications for a transcript already stored, without another Speech request',async()=>{
 h.transcript='Stored transcript';
 expect((await invoke()).status).toBe(200);
 expect(fetch).not.toHaveBeenCalled();expect(h.writes).toEqual(['voicemails','phone_callback_tasks']);
 expect(h.notify).toHaveBeenCalledWith(h.actor.db,expect.objectContaining({taskId:'paired-task',transcript:'Stored transcript'}),h.actor.system);
});
it('never notifies after a failed transcript write',async()=>{
 h.failWrite=true;expect((await invoke()).status).toBe(503);expect(h.notify).not.toHaveBeenCalled();
});
it('does not route recovered voicemail to a different paired-task owner',async()=>{
 h.foreign=true;expect((await invoke()).status).toBe(503);expect(h.notify).not.toHaveBeenCalled();
});
it('does not claim a deferred transcript notification while Speech is unavailable',async()=>{
 vi.mocked(fetch).mockResolvedValue(new Response(null,{status:503}));
 expect((await invoke()).status).toBe(503);expect(h.notify).not.toHaveBeenCalled();
});

it.each(['','Existing transcript'])('keeps transcripts readable after an extension is deleted (%s)',async(existing)=>{
 h.missingExtension=true;h.transcript=existing;
 expect((await invoke()).status).toBe(200);
 expect(h.notify).toHaveBeenCalledWith(h.actor.db,expect.objectContaining({extension:undefined,transcriptUpdate:true}),h.actor.system);
});
it('records empty recognition and notifies the canonical task after recovery',async()=>{
 const original=vi.mocked(fetch).getMockImplementation()!;
 vi.mocked(fetch).mockImplementation(async(url:any)=>String(url).includes('speech.googleapis.com')?Response.json({results:[]}):original(url));
 expect((await invoke()).status).toBe(422);
 expect(h.writes).toEqual(['voicemails','phone_callback_tasks']);
 expect(h.notify).toHaveBeenCalledWith(h.actor.db,expect.objectContaining({awaitingTranscript:false,summary:expect.stringContaining('No speech was detected')}),h.actor.system);
});

it('repairs a partial callback write before consuming a recovered notification claim',async()=>{
 h.failTable='phone_callback_tasks';expect((await invoke()).status).toBe(503);expect(h.notify).not.toHaveBeenCalled();
 h.failTable='';expect((await invoke()).status).toBe(200);
 expect(h.writes).toEqual(['voicemails','phone_callback_tasks','voicemails','phone_callback_tasks']);expect(h.notify).toHaveBeenCalledTimes(1);
});
it('does not notify an existing transcript while its paired record still fails to save',async()=>{
 h.transcript='Saved voicemail text';h.failTable='phone_callback_tasks';expect((await invoke()).status).toBe(503);expect(h.notify).not.toHaveBeenCalled();
});
