import {narrationCoverage} from '../../video/narration-coverage.mjs';

const captionFailure='Media quality gate failed: captions do not cover rendered narration';
/** Restore only certified producer history for a new independent inspection.
 * No decoded-media QA, publication or approval is certified by this helper.
 */
export function recoverCaptionCoverageInspection(artifacts,steps,findings,currentEvidence) {
  if(artifacts.__repairState || !Array.isArray(steps) || !Array.isArray(findings) || !findings.length ||
    !findings.every(f=>f?.step==='synchronization'&&f.code==='REPAIR_PRODUCER_UNCHANGED'&&
      f.message==='REPAIR_PRODUCER_UNCHANGED:synchronization'))return null;
  const timeline=artifacts.synchronization,film=artifacts.lesson_film_render;
  if(!currentEvidence(timeline)||!currentEvidence(film))return null;
  const failed=steps.find(s=>s?.step==='synchronization'&&s.state==='failed');
  const qa=steps.find(s=>s?.step==='finished_media_qa'&&s.state==='failed');
  const rendered=steps.find(s=>s?.step==='lesson_film_render'&&s.state==='passed');
  const requirements=Array.isArray(qa?.findings)?qa.findings.filter(f=>f?.severity==='error'):[];
  const times=[timeline.contractEvidence?.checkedAt,rendered?.completed_at,qa?.completed_at,failed?.completed_at].map(Date.parse);
  if(!requirements.length||!requirements.every(f=>f.step==='finished_media_qa'&&
      f.code==='Media quality gate failed'&&f.message===captionFailure)||
    !times.every(Number.isFinite)||times.some((t,i)=>i>0&&t<times[i-1]))return null;
  const segments=artifacts.natural_narration?.narration?.segments;
  if(!Array.isArray(segments)||!segments.length)return null;
  const authored=segments.map(s=>String(s.text??'')).join(' ');
  const captions=segments.flatMap(s=>Array.isArray(s.captions)?s.captions:[]).map(c=>String(c.text??'')).join(' ');
  // Require complete semantic token coverage in BOTH directions before treating
  // this as the known formatting-only inspector defect. Rendering still has
  // to pass independent decoded audio, frame, license and storage inspection.
  if(!authored.trim()||!captions.trim()||narrationCoverage(authored,captions)!==1||
    narrationCoverage(captions,authored)!==1)return null;
  return {status:'diagnosed',directive:{version:'verified-repair-v1',failedStep:'finished_media_qa',
    target:'finished_media_qa',previousTarget:'synchronization',attempt:1,requirements,
    instructions:'Reinspect retained certified media with canonical quantity matching; all independent decoded-media checks remain required.'}};
}
