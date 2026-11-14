import type {UltimateAssessmentItem} from './assessment-engine';
export interface UltimateAssessmentGenerator{generateLesson(input:unknown):Promise<UltimateAssessmentItem[]>;generateModule(input:unknown):Promise<UltimateAssessmentItem[]>;generatePracticeExam(input:unknown):Promise<UltimateAssessmentItem[]>;generateReassessment(input:unknown):Promise<UltimateAssessmentItem[]>}
