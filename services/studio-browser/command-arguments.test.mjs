import test from 'node:test';import assert from 'node:assert/strict';
import {commandArguments} from './command-arguments.mjs';
test('preserves code and file paths containing spaces',()=>{
 assert.deepEqual(commandArguments('node -e \'console.log("Studio command works")\''),['node','-e','console.log("Studio command works")']);
 assert.deepEqual(commandArguments('git diff -- "file with spaces.ts"'),['git','diff','--','file with spaces.ts']);
});
test('preserves empty arguments and rejects truncated or shell command chains',()=>{
 assert.deepEqual(commandArguments('node ""'),['node','']);
 assert.throws(()=>commandArguments('node "unterminated'),/invalid_command_quoting/);
 assert.throws(()=>commandArguments('git status && git diff'),/shell_operators_require_terminal/);
});
