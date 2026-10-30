import React from 'react';
import {render, screen, fireEvent, cleanup} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import AssessmentPreview from '@/components/admin/course-builder/AssessmentPreview';
import {lessonPreview} from '@/lib/ultimate-course-builder/core/lesson-preview';
import {loadCheckpointPage} from '@/lib/ultimate-course-builder/queries/checkpoint-page.mjs';
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

it('renders and grades the canonical saved lesson assessment returned by checkpoint polling',async()=>{
 const canonical={id:'lesson',title:'Tool care',is_published:true,passing_score:80,
  quiz_questions:[{id:'saved-question',question:question.prompt,options:question.choices,
   correctAnswer:0,explanation:question.explanation}]};
 const build={id:'build',course_id:'course',profile:{competencies:[{id:'tool-care'}],canonicalLessonIds:{'tool-care':'lesson'}}};
 const db={from(table:string){const result={data:table==='ultimate_course_builds'?build:table==='course_lessons'?[canonical]:[],error:null};
  const query={select:()=>query,eq:()=>query,order:()=>query,single:async()=>result,
   then:(resolve:(value:typeof result)=>unknown)=>Promise.resolve(result).then(resolve)};
  return query;}};
 const page=await loadCheckpointPage(db,'build');
 render(<AssessmentPreview assessment={page.ultimate_lesson_builds[0].preview.assessment}/>);
 expect(screen.getByText('1. Which tool is clean?')).toBeVisible();
 expect(screen.getByText('Passing score: 80%')).toBeVisible();
 fireEvent.click(screen.getByLabelText('Used comb'));
 fireEvent.click(screen.getByRole('button',{name:'Check practice answer'}));
 expect(screen.getByRole('status')).toHaveTextContent('Review this answer.');
 fireEvent.click(screen.getByLabelText('Disinfected comb'));
 fireEvent.click(screen.getByRole('button',{name:'Check practice answer'}));
 expect(screen.getByRole('status')).toHaveTextContent('Correct.');
 expect(screen.getByRole('status')).toHaveTextContent(question.explanation);
});
