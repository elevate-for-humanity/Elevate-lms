import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import StudioGeneratedFiles from '@/components/studio/StudioGeneratedFiles';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('creates the requested format through the existing runtime and exposes an authenticated download',async()=>{
 let created=false;
 const request=vi.fn(async(_url:string,options:RequestInit={})=>{
  if(options.method==='POST'){expect(JSON.parse(options.body as string)).toEqual({operation:'artifact-create',format:'pdf',title:'Partner overview',content:'Verified partner content'});created=true;return Response.json({ok:true});}
  return Response.json({files:created?[{name:'Partner-overview.pdf',size:4096}]:[]});
 });
 vi.stubGlobal('fetch',request);
 render(<StudioGeneratedFiles />);
 fireEvent.change(screen.getByLabelText('File type'),{target:{value:'pdf'}});
 fireEvent.change(screen.getByLabelText('Title'),{target:{value:'Partner overview'}});
 fireEvent.change(screen.getByLabelText('Document content'),{target:{value:'Verified partner content'}});
 fireEvent.click(screen.getByRole('button',{name:'Create file'}));
 expect(await screen.findByRole('link',{name:'Partner-overview.pdf'})).toHaveAttribute('href','/api/admin/dev-studio/runtime?operation=artifact&name=Partner-overview.pdf');
 expect(request.mock.calls.filter(([,options])=>options?.method==='POST')).toHaveLength(1);
});
