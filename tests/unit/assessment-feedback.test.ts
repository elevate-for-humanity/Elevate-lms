import {describe,expect,it} from 'vitest';
import {evaluateAnswer,scoreAnswers} from '@/lib/lms/assessment-feedback';

describe('server-authoritative coursework feedback',()=>{
  it('scores numeric and text answer keys',()=>{
    const questions=[
      {id:'clipper',options:['#1 guard','#4 guard'],correctAnswer:1,explanation:'Higher numbered guard keeps length.'},
      {id:'safety',options:['Continue','Stop and consult the trainer'],correctAnswer:'Stop and consult the trainer'},
    ];
    expect(scoreAnswers(questions,{clipper:1,safety:1})).toBe(100);
    expect(scoreAnswers(questions,{clipper:0,safety:1})).toBe(50);
    expect(evaluateAnswer(questions[0],0)).toEqual({
      correct:false,configured:true,correctOption:'#4 guard',
    });
  });
  it('does not automatically pass incomplete or missing answer keys',()=>{
    expect(evaluateAnswer({options:['A','B']},0).configured).toBe(false);
    expect(scoreAnswers([{id:'question',options:['A','B'],correctAnswer:1}],{})).toBe(0);
  });
  it('compares boolean answers and validates the configured choice',()=>{
    expect(evaluateAnswer({choices:['True','False'],correct_answer:false},1).correct).toBe(true);
    expect(evaluateAnswer({options:['A','B'],correctAnswer:7},7).configured).toBe(false);
  });
});
