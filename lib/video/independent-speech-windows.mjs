/** Re-decode the same audio with bounded, independent ASR windows. Expected
 * lesson words are used only by the caller's score, never as a decoder prompt. */
export async function independentSpeechWindows({read,coverage,minimumCoverage}) {
  let best;
  const attempts=[];
  for(const profile of ['default','wide','nonoverlap']) {
    const transcript=await read(profile);
    const score=coverage(transcript);
    if(typeof transcript!=='string'||!transcript.trim()||!Number.isFinite(score))
      throw Error('TRANSCRIPTION_INDEPENDENT_DECODE_REQUIRED');
    attempts.push({profile,coverage:score});
    if(!best||score>best.coverage)best={transcript,coverage:score,profile};
    if(best.coverage>=minimumCoverage)break;
  }
  return {...best,attempts};
}
