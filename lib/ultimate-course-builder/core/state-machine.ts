import {ULTIMATE_BUILD_STEPS,type UltimateBuildStep,type UltimateStepState} from './types';
export function initialStepStates():Record<UltimateBuildStep,UltimateStepState>{return Object.fromEntries(ULTIMATE_BUILD_STEPS.map(s=>[s,'pending'])) as Record<UltimateBuildStep,UltimateStepState>;}
export function assertCanStartStep(states:Record<UltimateBuildStep,UltimateStepState>,step:UltimateBuildStep){const i=ULTIMATE_BUILD_STEPS.indexOf(step);for(const prior of ULTIMATE_BUILD_STEPS.slice(0,i)){if(states[prior]!=='passed')throw new Error(`ULTIMATE_STEP_BLOCKED:${step}:WAITING_FOR:${prior}`);}}
export function nextStep(step:UltimateBuildStep){const i=ULTIMATE_BUILD_STEPS.indexOf(step);return ULTIMATE_BUILD_STEPS[i+1]??null;}
