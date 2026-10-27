import {expect,it,vi,afterEach} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
vi.mock('next/dynamic',()=>({default:()=>()=>null}));
import Workspace from '@/components/studio/DevStudioEditorWorkspace';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('limits the initial file list but lets search find a file beyond that limit',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({branch:'main',tree:Array.from({length:300},(_,i)=>({name:`file-${i}.html`,path:`file-${i}.html`,type:'file'}))}))));
 render(<Workspace/>);await screen.findByRole('button',{name:'file-0.html',exact:true});
 expect(screen.queryByRole('button',{name:'file-299.html',exact:true})).toBeNull();
 fireEvent.change(screen.getByLabelText('Search repository files'),{target:{value:'file-299'}});
 expect(screen.getByRole('button',{name:'file-299.html',exact:true})).toBeTruthy();expect(screen.queryByRole('button',{name:'file-0.html',exact:true})).toBeNull();
});
