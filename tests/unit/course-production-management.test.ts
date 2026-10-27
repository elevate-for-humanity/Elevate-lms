import {describe,it,expect} from 'vitest';
import {applySyllabusPlan,validateSyllabusPlan} from '@/lib/ultimate-course-builder/authoring/syllabus-plan';
const plan={text:'Authorized instruction for the course. Follow the source and verify each result.',modules:[{title:'Orientation',lessons:[{title:'Safety fundamentals',objectives:['Recognize hazards'],content:'Identify the hazard before beginning work.'},{title:'Client consultation',objectives:['Discuss client needs'],content:'Ask the client about the service they need.'}]}]};
const profile={id:'p',title:'Course',authority:'course-defined',standardVersion:'1',sourceDocuments:[],socCodes:[],competencies:[]};
describe('syllabus production contract',()=>{
 it('creates ordered competencies from the reviewed syllabus curriculum with the original source',()=>{
  expect(validateSyllabusPlan(plan)).toBe(true);
  const result=applySyllabusPlan(profile,plan);
  expect(result.competencies.map(c=>c.id)).toEqual(['syllabus-1-1','syllabus-1-2']);
  expect(result.competencies[1].description).toBe('Discuss client needs');
  expect(result.instructionalSources).toContainEqual({id:'syllabus:uploaded',text:plan.text});
 });
 it('preserves every registered competency instead of replacing authority with an AI outline',()=>{
  const regulated={...profile,authority:'DOL',competencies:[{id:'registered',title:'Registered requirement',description:'Demonstrate',type:'knowledge' as const,authorityRequirementIds:['standard'],requiresDemonstration:true,requiresPracticalEvidence:true}]};
  expect(applySyllabusPlan(regulated,plan).competencies).toEqual(regulated.competencies);
 });
 it('rejects empty, oversized, and malformed plans before dispatch',()=>{
  for(const value of [null,{}, {...plan,text:''},{...plan,text:'x'.repeat(250001)},{...plan,modules:[{title:'M',lessons:[]}]},{...plan,modules:[{title:'M',lessons:[{title:'L',objectives:[42]}]}]}]) expect(validateSyllabusPlan(value)).toBe(false);
 });
});
