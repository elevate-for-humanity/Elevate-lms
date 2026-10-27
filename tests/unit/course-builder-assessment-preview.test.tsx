import React from 'react';
import {render, screen, fireEvent, cleanup} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import AssessmentPreview from '@/components/admin/course-builder/AssessmentPreview';
import {lessonPreview} from '@/lib/ultimate-course-builder/core/lesson-preview';
afterEach(cleanup);
const question={id:'one',prompt:'Which tool is clean?',choices:['Disinfected comb','Used comb'],answerIndex:0,explanation:'Disinfect tools before reuse.',remediation:'Review sanitation.'};
it('saved assessment reaches the preview before video completion',()=>{
 const preview=lessonPreview({assessment_alignment:{assessment:{questions:[question],passingScore:80,reassessment:[{...question,id:'retry'}]}}});
 expect(preview.assessment?.questions).toEqual([question]);
 expect(preview.assessment?.reassessment).toHaveLength(1);
 expect(preview.mediaApproved).toBe(false);
});
it('checks a practice answer and clears stale feedback when the choice changes',()=>{
 render(<AssessmentPreview assessment={{questions:[question],passingScore:80,reassessment:[]}}/>);
 const check=screen.getByRole('button',{name:'Check practice answer'});
 expect(check).toBeDisabled();
 fireEvent.click(screen.getByLabelText('Used comb'));fireEvent.click(check);
 expect(screen.getByRole('status')).toHaveTextContent('Review this answer.');
 expect(screen.getByRole('status')).toHaveTextContent('Review sanitation.');
 fireEvent.click(screen.getByLabelText('Disinfected comb'));
 expect(screen.queryByRole('status')).toBeNull();
 fireEvent.click(check);expect(screen.getByRole('status')).toHaveTextContent('Correct.');
 expect(screen.getByText(/do not create learner grades/)).toBeInTheDocument();
});
it('does not invent questions before the assessment checkpoint exists',()=>{
 render(<AssessmentPreview assessment={null}/>);
 expect(screen.queryByRole('radio')).toBeNull();
 expect(screen.getByText(/checkpoint is saved/)).toBeInTheDocument();
});
