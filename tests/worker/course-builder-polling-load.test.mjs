import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for (const component of [
 'CourseSidePreview.tsx',
 'UltimateStageInspector.tsx',
 'CoursePipelineDiagram.tsx',
]) {
 test(component+' does not poll hidden tabs or poll faster than 30 seconds',()=>{
  const source=readFileSync(new URL('../../components/admin/course-builder/'+component,import.meta.url),'utf8');
  assert.match(source,/document\.visibilityState === ["']visible["']/);
  assert.match(source,/window\.setInterval\([\s\S]*?, 30000\)/);
  assert.doesNotMatch(source,/window\.setInterval\([\s\S]*?, 15000\)/);
 });
}
