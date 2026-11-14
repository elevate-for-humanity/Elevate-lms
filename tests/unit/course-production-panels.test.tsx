import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import ProductionPanelLayout from '@/components/admin/course-builder/ProductionPanelLayout';
afterEach(cleanup);
it('keeps the same preview and unsaved input while selecting mobile panes and expanding the preview',()=>{
 render(<ProductionPanelLayout outline={<p>Saved outline</p>} operations={<button>Resume course</button>}><video aria-label="Saved video" /><input aria-label="Lesson draft" defaultValue="Keep this text" /></ProductionPanelLayout>);
 const video=screen.getByLabelText('Saved video');const draft=screen.getByLabelText('Lesson draft');
 fireEvent.click(screen.getByRole('button',{name:'Operations',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Preview',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Expand preview',exact:true}));
 expect(screen.getByLabelText('Saved video')).toBe(video);expect(screen.getByLabelText('Lesson draft')).toBe(draft);
 expect(draft).toHaveValue('Keep this text');
 fireEvent.keyDown(window,{key:'Escape'});expect(screen.getByRole('button',{name:'Expand preview'})).toHaveAttribute('aria-pressed','false');
});
