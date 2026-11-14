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
  // Match occurrences, not merely vocabulary: one recognized word cannot
  // certify multiple required spoken instances. Canonical quantity tokens
  // retain their existing numeric equivalence and QA thresholds are unchanged.
  const deliveredCounts=new Map();
  for(const token of narrationTokens(spokenCaptionText(deliveredTranscript)))
    deliveredCounts.set(token,(deliveredCounts.get(token)??0)+1);
  let covered=0;
  for(const token of expected){
    const available=deliveredCounts.get(token)??0;
    if(available>0){deliveredCounts.set(token,available-1);covered++;}
  }
  return covered/expected.length;
}
