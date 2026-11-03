export const BUSINESS_RETAIL_COURSE_ID: string;
export const BUSINESS_RETAIL_WORKBOOK_SLUG: string;
export const BUSINESS_RETAIL_VERSION: string;
export const businessRetailSources: {title:string;url:string}[];
export type BusinessRetailProject = {id:string;title:string;lesson:string;esb:string[];retail:string[];teaching:string;scenario:string;tasks:string[];decision:string;choices:string[];correct:number;explanation:string;math:string|null};
export const businessRetailProjects: BusinessRetailProject[];
export function businessRetailCase(kind:string|null,variant?:number): {facts:string;checks:[string,number,string][]};
export function checkBusinessRetailNumber(value:string,expected:number): boolean;
export function businessRetailSections(): {section_number:number;title:string;unit:string;lesson_slug:string;prompts:string[]}[];
