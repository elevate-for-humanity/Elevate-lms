import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import RealRepoWorkspace from '@/components/studio/RealRepoWorkspace';
afterEach(()=>{cleanup();window.sessionStorage.clear();vi.unstubAllGlobals();});
it('loads actual container files and supplies the required main-commit confirmation',async()=>{
 const writes:any[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:any={})=>{
  const body=options.body?JSON.parse(options.body):{};
  let data:any={ok:true};
  if(url.includes('files?source=container&path='))data={path:'example.ts',content:'old',sha:'a'.repeat(40),branch:'main'};
  else if(url.includes('files?source=container'))data={tree:[{name:'example.ts',path:'example.ts',type:'file'}],branch:'main'};
  else if(body.operation==='terminal-create')data={id:'session'};
  else if(options.method==='PUT'){writes.push(body);data={sha:'b'.repeat(40)};}
  return {ok:true,json:async()=>data};
 }));
 render(<RealRepoWorkspace/>);
 fireEvent.click(await screen.findByRole('button',{name:'example.ts'}));
 const editor=await screen.findByPlaceholderText('// Edit the real Elevate-lms repository here');
 fireEvent.change(editor,{target:{value:'fixed'}});
 const commit=screen.getByRole('button',{name:'Commit',exact:true});expect(commit).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Main commit confirmation'),{target:{value:'CONFIRM PUSH'}});
 expect(commit).toBeEnabled();fireEvent.click(commit);
 await waitFor(()=>expect(writes).toHaveLength(1));
 expect(writes[0]).toMatchObject({path:'example.ts',content:'fixed',confirmation:'CONFIRM PUSH',sha:'a'.repeat(40)});
});
it('reattaches saved interrupted terminals without syncing, creating or replaying commands',async()=>{
 window.sessionStorage.setItem('elevate.studio.terminal.v1','saved-terminal');
 const calls:any[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:any={})=>{
  const body=options.body?JSON.parse(options.body):{};calls.push({url,body});
  const data=url.includes('terminal-output')?{id:'saved-terminal',output:[{seq:1,data:'saved output'}],cursor:1,state:'interrupted',exitCode:null}:body.operation==='terminal-resume'?{id:'saved-terminal',state:'running'}:{tree:[]};
  return {ok:true,json:async()=>data};
 }));
 const view=render(<RealRepoWorkspace/>);
 const resume=await screen.findByRole('button',{name:'Start new shell'});
 expect(calls.some(x=>['repository-sync','terminal-create','terminal-input','terminal-resume'].includes(x.body.operation))).toBe(false);
 fireEvent.click(resume);
 await waitFor(()=>expect(calls.filter(x=>x.body.operation==='terminal-resume')).toHaveLength(1));
 view.unmount();await Promise.resolve();expect(calls.some(x=>x.body.operation==='terminal-stop')).toBe(false);
});
