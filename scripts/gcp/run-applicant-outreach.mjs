import {spawnSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
const mode=process.argv[2];if(!['prepare','send','replies'].includes(mode))throw new Error('Explicit outreach mode required');
const config=loadGoogleConfig('admin');
if(config.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co')throw new Error('Unexpected database');
const result=spawnSync('node',['--import','tsx','scripts/applicant-outreach.ts',mode],{env:{...process.env,...config.runtimeEnvironment},stdio:'inherit'});
process.exitCode=result.status??1;
