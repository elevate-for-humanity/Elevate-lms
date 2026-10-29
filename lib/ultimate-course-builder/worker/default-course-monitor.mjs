import {COURSE_AI_ROLES} from './paris-monitor.mjs';
/** New continuations recover automatically; a saved explicit disable remains intentional. */
export function defaultCourseMonitor(saved) {
 return {enabled:true,coordinator:'PARIS',agents:COURSE_AI_ROLES,...saved};
}
