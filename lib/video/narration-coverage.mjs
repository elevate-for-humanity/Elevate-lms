import {narrationTokens} from '../ultimate-course-builder/instructional/narration-numbers.mjs';

function spokenCaptionText(value) {
  const text=String(value??'');
  const timing=/^\s*(?:\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+(?:\d{2}:)?\d{2}:\d{2}[.,]\d{3}(?:\s+.*)?\s*$/;
  if(!text.split(/\r?\n/).some(line=>timing.test(line)))return text;
  return text.split(/\r?\n\s*\r?\n/).flatMap(block=>{
    const lines=block.split(/\r?\n/);
    const index=lines.findIndex(line=>timing.test(line));
    return index<0?[]:lines.slice(index+1);
  }).join(' ');
}

/** Compare the same spoken quantities across authored and ASR spellings.
 * This changes token identity only; callers retain their coverage thresholds.
 */
export function narrationCoverage(script, deliveredTranscript) {
  const expected=narrationTokens(String(script??''));
  if(!expected.length)return 1;
  const delivered=new Set(narrationTokens(spokenCaptionText(deliveredTranscript)));
  return expected.filter(word=>delivered.has(word)).length/expected.length;
}
