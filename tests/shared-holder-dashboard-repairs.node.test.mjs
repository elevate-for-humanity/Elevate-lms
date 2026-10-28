import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const paths = ["components/communications/PlatformVideoRoom.tsx","apps/admin/app/students/[id]/page.tsx","apps/admin/app/students/page.tsx","components/program-holder/ProgramHolderOfficeTools.tsx","components/program-holder/StudentCommunicationActions.tsx","apps/lms/app/api/program-holder/meetings/route.ts","components/program-holder/ProgramHolderMeetingRoom.tsx","apps/lms/app/api/program-holder/student-invitations/route.ts","components/pwa/CanonicalPwaRegistration.tsx"];
const candidateFiles = Object.fromEntries(paths.map(path => [path, readFileSync(new URL('../' + path, import.meta.url), 'utf8')]));
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };

function compile(source,fileName){const result=ts.transpileModule(source,{fileName,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}); const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));return result.outputText;}
function badgeLabel(source,state,accessGranted){let code=source.slice(source.indexOf('function EnrollmentBadge('),source.indexOf('function isTestOrAuditProfile'));let scope={exports:{},require:()=>jsx};vm.runInNewContext(compile(code+'\nexports.Badge=EnrollmentBadge;','badge.tsx'),scope);return scope.exports.Badge({state,accessGranted}).props.children;}
async function submitCase(source,mode,kind){let states=[],resets=0,calls=0;
let react={useState:(v)=>[v,n=>states.push(n)],useCallback:f=>f,useEffect:()=>{}};
let response={ok:kind!=='http',status:kind==='http'?403:200,headers:{get:()=>kind==='html'?'text/html':'application/json'},json:async()=>kind==='http'?{error:'Forbidden'}:{}};
let scope={exports:{},require:n=>n==='react'?react:n==='react/jsx-runtime'?jsx:{},FormData:class{get(key){return key==='startsAt'?(kind==='invalid'?'':'2026-11-01T16:00'):''}},fetch:async()=>{calls++;if(kind==='network')throw Error('Network unavailable');return response;}};
vm.runInNewContext(compile(source,'office.tsx'),scope);
let tree=scope.exports.ProgramHolderOfficeTools({mode});
function find(node){if(!node||typeof node!=='object')return; if(node.type==='form')return node;let children=node.props?.children;for(let child of Array.isArray(children)?children:[children]){let found=find(child);if(found)return found;}}
let event={preventDefault(){},currentTarget:{reset(){resets++}}};let action=find(tree).props.onSubmit(event);event.currentTarget=null;let thrown='';try{await action;}catch(e){thrown=String(e)}return {states,resets,calls,thrown};}
async function commCase(source,kind){let states=[],resets=0;let react={useState:v=>[v,n=>states.push(n)]};let scope={exports:{},require:n=>n==='react'?react:jsx,FormData:class{get(){return ''}},fetch:async()=>{if(kind==='network')throw Error('Network unavailable');return{ok:kind==='ok',json:async()=>({})}}};vm.runInNewContext(compile(source,'communication.tsx'),scope);let tree=scope.exports.StudentCommunicationActions({enrollmentId:'test',studentName:'Test learner',hasEmail:true,hasPhone:false});let fn=ts.createSourceFile('communication.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let submit;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='submit')submit=n.getText(fn);ts.forEachChild(n,visit)}visit(fn);let body=compile(submit+'\nexports.submit=submit;','submit.ts');scope.enrollmentId='test';scope.studentName='Test learner';scope.setBusy=n=>states.push(n);scope.setMessage=n=>states.push(n);vm.runInNewContext(body,scope);let ev={preventDefault(){},currentTarget:{reset(){resets++}}};let pending=scope.exports.submit(ev);ev.currentTarget=null;let thrown='';try{await pending}catch(e){thrown=String(e)}return{states,resets,thrown};}
const meetingRouteTest = async(source,{method='video',delivery='ok',mode='holder',assigned=true,ready=true}={})=>{let emails=[],updates=[],filters=[];let logger={error(){},warn(){}};let ctx={mode,holderId:'holder-one',tenantId:null,user:{id:'host'},profile:{full_name:'Host',email:'host@example.test'},db:{from(table){let operation='select';let q={select(){return q},eq(k,v){filters.push([table,k,v]);return q},is(){return q},lt(){return q},gte(){return q},in(){return q},limit(){return q},order(){return q},insert(){operation='insert';return q},update(v){operation='update';updates.push([table,v]);return q},delete(){operation='delete';return q},maybeSingle(){return q},single(){return q},then(resolve){let data=table==='program_holder_students'?(assigned?{id:'holder-student',user_id:'student',applicant_name:'Test learner'}:null):table==='communication_workspaces'?{id:'workspace',status:'active'}:table==='communication_rooms'?{id:'room-one'}:table==='program_holder_meetings'?(operation==='select'?[]:{id:'meeting-one'}):table==='profiles'?(delivery==='missing'?null:{email:'student@example.test'}):{};return Promise.resolve({data,error:null}).then(resolve)}};return q}}};
let scope={exports:{},crypto:{randomUUID:()=> 'room-key'},URL,require:n=>n==='next/server'?{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}}:n.includes('google-calendar')?{assertGoogleCalendarAvailable:async()=>{},CalendarConflictError:class extends Error{}}:n.includes('require-program-holder')?{requireProgramHolder:async()=>ctx}:n.includes('livekit')?{liveKitReadiness:()=>({ready}),ensureLiveKitRoom:async()=>{}}:n.includes('sendgrid')?{sendEmail:async input=>{emails.push(input);if(delivery==='throw')throw Error('Provider unavailable');return {success:delivery==='ok'}}}:n.includes('logger')?{logger}:{hydrateProcessEnv:async()=>{}}};
vm.runInNewContext(compile(source,'route.ts'),scope);let result=await scope.exports.POST({json:async()=>({programHolderStudentId:'holder-student',startsAt:'2026-11-01T16:00:00Z',meetingMethod:method,durationMinutes:30,title:'Course support'})});return{result,emails,updates,filters};};
function roomCase(source,initialError=''){let changes=[],index=0;let react={useState:v=>{let i=index++;return[i===0?true:i===2?{token:'test',serverUrl:'wss://test.invalid'}:i===3?initialError:v,n=>changes.push([i,n])]},useEffect(){}};let scope={exports:{},require:n=>n==='react'?react:n==='react/jsx-runtime'?jsx:{LiveKitRoom:'LiveKitRoom',RoomAudioRenderer:'Audio',VideoConference:'Conference'}};vm.runInNewContext(compile(source+'\nexports.VideoRoomConnection=VideoRoomConnection;','room.tsx'),scope);return{tree:scope.exports.VideoRoomConnection({tokenEndpoint:'/api/program-holder/meetings/test/token'}),changes};}

test('enrollment labels separate admission from course access', () => {
  const source = candidateFiles['apps/admin/app/students/page.tsx'];
  assert.equal(badgeLabel(source, 'enrolled', false), 'Enrolled · Access pending');
  assert.equal(badgeLabel(source, 'active', false), 'Enrolled · Access pending');
  assert.equal(badgeLabel(source, 'completed', false), 'Completed');
  assert.equal(badgeLabel(source, 'suspended', false), 'Suspended');
});

test('meeting and office mail forms survive React event cleanup and failures', async () => {
  const source = candidateFiles['components/program-holder/ProgramHolderOfficeTools.tsx'];
  for (const mode of ['meetings', 'mail']) {
    if (mode === 'meetings') {
      const invalid = await submitCase(source, mode, 'invalid');
      assert.equal(invalid.thrown, '');
      assert.equal(invalid.calls, 0);
      assert.equal(invalid.resets, 0);
      assert.equal(invalid.states.at(-1), 'Enter a valid meeting date and time.');
    }
    const saved = await submitCase(source, mode, 'ok');
    assert.equal(saved.thrown, '');
    assert.equal(saved.resets, 1);
    assert.equal(saved.calls, 2);
    assert.equal(saved.states.at(-1), mode === 'meetings'
      ? 'Meeting scheduled, but the invitation email was not sent. Contact the student before the meeting.'
      : 'Office message sent.');
    for (const kind of ['network', 'html', 'http']) {
      const failed = await submitCase(source, mode, kind);
      assert.equal(failed.thrown, '');
      assert.equal(failed.resets, 0);
      assert.notEqual(failed.states.at(-1), 'Saving…');
    }
  }
});

test('student communication resets only after success and clears busy on errors', async () => {
  const source = candidateFiles['components/program-holder/StudentCommunicationActions.tsx'];
  for (const kind of ['ok', 'network', 'http']) {
    const result = await commCase(source, kind);
    assert.equal(result.thrown, '');
    assert.equal(result.resets, kind === 'ok' ? 1 : 0);
    assert.equal(result.states.at(-1), false);
  }
});

test('meeting invitation uses the student route and reports transport outcomes', async () => {
  const source = candidateFiles['apps/lms/app/api/program-holder/meetings/route.ts'];
  for (const method of ['video', 'phone', 'in_person']) {
    const { result, emails, updates, filters } = await meetingRouteTest(source, { method });
    assert.equal(result.status, 201);
    assert.equal(result.body.invitationDelivery, 'accepted');
    assert.equal(emails.length, 1);
    assert.ok(filters.some(([table, key, value]) => table === 'program_holder_students' && key === 'program_holder_id' && value === 'holder-one'));
    if (method === 'video') {
      assert.ok(emails[0].text.includes('/login?redirect=%2Flms%2Fmeetings%2Froom-one'));
      assert.ok(!emails[0].text.includes('/program-holder/meetings'));
      assert.ok(updates.some(([table, value]) => table === 'communication_room_participants' && value.invite_status === 'sent'));
    }
  }
  for (const delivery of ['failed', 'throw', 'missing']) {
    const { result, updates } = await meetingRouteTest(source, { delivery });
    assert.equal(result.status, 201);
    assert.equal(result.body.invitationDelivery, delivery === 'missing' ? 'missing_email' : 'failed');
    assert.equal(updates.length, 0);
  }
  for (const options of [{ mode: 'preview' }, { assigned: false }, { ready: false }]) {
    const { result, emails } = await meetingRouteTest(source, options);
    assert.ok(result.status >= 400);
    assert.equal(emails.length, 0);
  }
});

test('meeting room exposes connection failures, device feedback, and retry', () => {
  const wrapper = candidateFiles['components/program-holder/ProgramHolderMeetingRoom.tsx'];
  const wrapperScope = {exports:{},require:n=>n==='react/jsx-runtime'?jsx:{PlatformVideoRoom:'PlatformVideoRoom'}};
  vm.runInNewContext(compile(wrapper,'holder-room.tsx'),wrapperScope);
  const delegated = wrapperScope.exports.ProgramHolderMeetingRoom({roomId:'test'});
  assert.equal(delegated.type,'PlatformVideoRoom');
  assert.equal(delegated.props.tokenEndpoint,'/api/program-holder/meetings/test/token');
  assert.equal(wrapperScope.exports.ProgramHolderMeetingRoom({roomId:'test',tokenEndpoint:'/custom/token'}).props.tokenEndpoint,'/custom/token');
  const source = candidateFiles['components/communications/PlatformVideoRoom.tsx'];
  const result = roomCase(source);
  const room = result.tree.props.children;
  room.props.onError(Error('Connection unavailable'));
  assert.ok(result.changes.some(([index, value]) => index === 3 && value === 'Connection unavailable'));
  room.props.onMediaDeviceFailure();
  assert.ok(result.changes.some(([index, value]) => index === 4 && String(value).includes('permissions')));
  const retry = roomCase(source, 'Connection unavailable');
  assert.equal(retry.tree.props.role, 'alert');
  retry.tree.props.children.find(node => node.type === 'button').props.onClick();
  assert.ok(retry.changes.some(([index, value]) => index === 2 && value === null));
  assert.ok(retry.changes.some(([index, value]) => index === 1 && typeof value === 'function'));
});

test('all changed TSX and route files transpile', () => {
  for (const [path, source] of Object.entries(candidateFiles)) compile(source, path);
});

const invitationCase = async function invitationCase(source,{mode='holder',assigned=true,state='active',role='student',email=true,link=true,delivery='ok',rateLimited=false,queryError=false,body=true}={}){let emails=[],links=[],filters=[];let ctx={mode,holderId:'holder-one',profile:{email:'host@example.test'},db:{auth:{admin:{getUserById:async()=>({data:{user:{email:'student@example.test'}},error:null}),generateLink:async input=>{links.push(input);return link?{data:{properties:{action_link:'https://auth.example.test/verify?token=fake&redirect_to=student'}},error:null}:{data:null,error:{message:'unavailable'}}}}},from(table){let q={select(){return q},eq(k,v){filters.push([table,k,v]);return q},maybeSingle:async()=>({data:table==='program_enrollments'?(assigned?{id:'enrollment-one',user_id:'student',status:state,enrollment_state:state}:null):{email:email?'student@example.test':null,role},error:queryError?{message:'unavailable'}:null})};return q}}};
let scope={exports:{},require:n=>n==='next/server'?{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}}:n.includes('google-calendar')?{assertGoogleCalendarAvailable:async()=>{},CalendarConflictError:class extends Error{}}:n.includes('require-program-holder')?{requireProgramHolder:async()=>ctx}:n.includes('withRateLimit')?{applyRateLimit:async()=>rateLimited?{status:429}:null}:n.includes('sendgrid')?{sendEmail:async input=>{emails.push(input);if(delivery==='throw')throw Error('unavailable');return{success:delivery==='ok'}}}:{}};vm.runInNewContext(compile(source,'invite.ts'),scope);let result=await scope.exports.POST({json:async()=>body?{enrollmentId:'enrollment-one'}:{}});return{result,emails,links,filters};};

test('holder student invitations preserve assignment and identity boundaries', async () => {
  const source = candidateFiles['apps/lms/app/api/program-holder/student-invitations/route.ts'];
  const success = await invitationCase(source);
  assert.equal(success.result.status, 200);
  assert.equal(success.result.body.delivery, 'accepted');
  assert.ok(success.filters.some(([table, key, value]) => table === 'program_enrollments' && key === 'program_holder_id' && value === 'holder-one'));
  assert.equal(success.links[0].type, 'magiclink');
  assert.equal(success.emails[0].to, 'student@example.test');
  assert.equal(success.result.body.invitationUrl, undefined);
  for (const options of [{ mode: 'preview' }, { assigned: false }, { state: 'revoked' }, { state: 'suspended' }, { role: 'admin' }, { email: false }, { link: false }, { rateLimited: true }, { queryError: true }, { body: false }]) {
    const result = await invitationCase(source, options);
    assert.ok(result.result.status >= 400);
    assert.equal(result.emails.length, 0);
  }
  for (const delivery of ['failed', 'throw']) {
    const result = await invitationCase(source, { delivery });
    assert.equal(result.result.status, 502);
  }
});

test('operational PWA updates remain available without public marketing banners', () => {
  const source = candidateFiles['components/pwa/CanonicalPwaRegistration.tsx'];
  const scope = {
    exports: {},
    process: { env: { NODE_ENV: 'test' } },
    require: name => name === 'react' ? { useEffect() {} }
      : name === 'react/jsx-runtime' ? jsx
      : name === './PwaUpdateNotice' ? { PwaUpdateNotice: 'UpdateNotice' } : {},
  };
  vm.runInNewContext(compile(source, 'pwa.tsx'), scope);
  assert.equal(scope.exports.CanonicalPwaRegistration({ application: 'marketing' }), null);
  assert.equal(scope.exports.CanonicalPwaRegistration({ application: 'admin' }).type, 'UpdateNotice');
  assert.equal(scope.exports.CanonicalPwaRegistration({ application: 'lms' }).type, 'UpdateNotice');
});
