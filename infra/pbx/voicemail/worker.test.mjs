import test from 'node:test';
import assert from 'node:assert/strict';
import {caller} from './worker.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('voicemail preserves bracketed and bare caller numbers without substituting the business number',()=>{
 for(const [input,expected] of [
  ['"Caller" <+13175550100>','+13175550100'],
  ['+13175550100','+13175550100'],
  ['3175550100','+13175550100'],
  ['13175550100','+13175550100'],
  ['"Caller" <(317) 555-0100>','+13175550100'],
  ['"Caller" <+1 317-555-0100>','+13175550100'],
  ['(317) 555-0100','+13175550100'],['317.555.0100','+13175550100'],
  ['+1 (317) 555-0100','+13175550100'],
  ['"International caller" <+442079460000>','+442079460000'],
  ['+442079460000','+442079460000'],
  ['+44 20 7946 0000','+442079460000'],
  ['"Extension 101" <101>','101'],['101','101'],['0','0'],
 ])assert.equal(caller(input),expected,input);
});

test('the systemd worker entry still validates configuration before starting its scan loop',()=>{
 const env={...process.env};delete env.PBX_PHONE_SYSTEM_ID;delete env.PBX_PROVISIONING_TOKEN_SECRET;
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./worker.mjs',import.meta.url))],{env,encoding:'utf8',timeout:3000});
 assert.equal(result.status,1);assert.match(result.stderr,/VOICEMAIL_SYSTEM_UNCONFIGURED/);
 assert.equal(result.error,undefined);
});

test('voicemail does not invent caller identity from anonymous or ambiguous metadata',()=>{
 for(const input of [undefined,'','unknown','anonymous','"Anonymous" <anonymous>',
  'caller3175550100','<abc3175550100>','<+13175550100> <+13175550101>',
  '+13175550100 trailing','<+13175550100> trailing','+13175550100\nInjected',
  '<+13175550100\nInjected>','++13175550100','+01234567890','1234',
  '317/555/0100','317..555..0100','(317)(555)0100','1 2','3175550100 3175550101',
 ])assert.equal(caller(input),'unknown',String(input));
});
