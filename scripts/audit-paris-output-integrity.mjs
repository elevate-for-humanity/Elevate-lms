import {readFileSync, readdirSync} from 'node:fs';
import {resolve, relative, basename} from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
function files(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry => entry.isDirectory()
    ? files(resolve(dir,entry.name)) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [resolve(dir,entry.name)] : []);
}
const paths = [...files(resolve(root,'lib/paris')),resolve(root,'lib/ai/paris-ai.ts'),
  ...files(resolve(root,'lib/devstudio')).filter(path=>/^(?:paris-|repair-)/.test(basename(path))),
  resolve(root,'lib/ai/runtime/command-executor.ts'), resolve(root,'lib/ai/runtime/paris-runtime-evidence.mjs')];
const forbidden = [
  ['random-stock-as-generated', 'https://picsum.photos/'],
  ['fake-background-removal', "imageUrl + '?nobg=true'"],
  ['fake-image-description', "return 'Generated alt text for this image'"],
  ['provider-demo-success', 'getDemoResponse('],
  ['fake-publish-queue', "success: true, result: { message: 'Content queued for publishing' }"],
  ['fabricated-api-server', "'https://api.example.com'"],
];
const findings = [];
const inventory = [];
for (const path of [...new Set(paths)].sort()) {
  const text = readFileSync(path,'utf8');
  const source = ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);
  const claims = [];
  function walk(node) {
    if (ts.isPropertyAssignment(node) && ['success','ok','executed','isReady','productionReady'].includes(node.name.getText(source))) {
      const position = source.getLineAndCharacterOfPosition(node.getStart(source));
      claims.push({line:position.line+1,claim:node.getText(source)});
    }
    ts.forEachChild(node,walk);
  }
  walk(source);
  for (const [rule,marker] of forbidden) {
    const at = text.indexOf(marker);
    if (at >= 0) findings.push({path:relative(root,path),line:text.slice(0,at).split('\n').length,rule});
  }
  inventory.push({path:relative(root,path),lines:text.split('\n').length,claims});
}
console.log(JSON.stringify({scope:'PARIS libraries and repair adapters',
  limitation:'Checks known fabrication regressions and inventories claims for review; passing is not live runtime acceptance.',
  files:inventory.length,findings,inventory},null,2));
if (findings.length) process.exitCode=1;
