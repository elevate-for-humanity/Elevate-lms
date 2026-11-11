import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import LessonFocusShell from '@/components/lms/LessonFocusShell';
import LearningWorkspace from '@/components/lms/LearningWorkspace';
afterEach(()=>{cleanup();document.body.style.overflow='';});
it.each(['escape','navigate'])('restores scrolling after combined modes: %s', action=>{
 const view=render(<LessonFocusShell header={<p>Lesson</p>}><LearningWorkspace instructions={<textarea aria-label="Answer"/>} preview={<p>Video</p>}/></LessonFocusShell>);
 fireEvent.click(screen.getByRole('button',{name:'Enter focus mode'}));
 fireEvent.click(screen.getByRole('button',{name:'Full screen lesson'}));
 if(action==='escape')fireEvent.keyDown(document,{key:'Escape'});else view.unmount();
 expect(document.body.style.overflow).toBe('');
});
