export const BEAUTY_SOURCE_VERSION: string;
export const BEAUTY_SOURCE_REFERENCES: Array<{id:string;url:string;scope:string}>;
export function registeredBeautyLessons(occupation:string): Array<{id:string;title:string;content:{html:string;experience:Record<string,any>;provenance:Record<string,any>};source:{id:string;text:string}}>;
export function registeredBeautySources(programSlug:string): Array<{id:string;text:string}>;
