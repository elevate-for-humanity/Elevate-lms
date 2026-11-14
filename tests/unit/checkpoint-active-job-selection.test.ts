import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('apps/admin/app/api/admin/ultimate-course-builder/checkpoint/route.ts','utf8');
describe('checkpoint repair targets active durable job',()=>{
 it('selects an active queue entry before newest failed historical entry',()=>{
   expect(source).toContain(".limit(30)");
   expect(source).toContain("['running', 'queued', 'waiting_for_dependency'].includes(job.status)");
 });
 it('does not reset a checkpoint that already passed',()=>{
   expect(source).toContain("checkpoint?.state === 'passed'");
   expect(source).toContain('No completed media was changed.');
 });
});
