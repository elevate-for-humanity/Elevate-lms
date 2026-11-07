import {narrationTokens} from '../ultimate-course-builder/instructional/narration-numbers.mjs';

/** Compare the same spoken quantities across authored and ASR spellings.
 * This changes token identity only; callers retain their coverage thresholds.
 */
export function narrationCoverage(script, deliveredTranscript) {
  const expected=narrationTokens(String(script??''));
  if(!expected.length)return 1;
  const delivered=new Set(narrationTokens(String(deliveredTranscript??'')));
  return expected.filter(word=>delivered.has(word)).length/expected.length;
}
