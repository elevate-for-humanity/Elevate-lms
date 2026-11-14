'use client';
import {createContext} from 'react';
export type CourseSelection = {lessonKey:string;lessonId:string;canonicalLessonId?:string;title?:string};
export const CourseWorkspaceContext = createContext<{
 previewTarget:HTMLElement|null;
 onSelection?:(selection:CourseSelection)=>void;
 onBuild?:(buildId:string,courseId?:string,status?:string)=>void;
 requestedLessonId?:string;
}>({previewTarget:null});
