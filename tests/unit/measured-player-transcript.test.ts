import { describe, it, expect } from 'vitest';
import { measuredLessonAsset, measuredLessonCues } from '../../lib/video/measured-lesson-assets';

describe('saved measured player transcript', () => {
  it('preserves the measured caption words and seek times in both player and VTT', () => {
    const cues = [{start:0.4,end:2.6,text:'Welcome to Elevate for Humanity. I'}, {start:2.6,end:4.9,text:'am Paris, your AI learning guide.'}];
    const film = {durationSeconds:292.041667,captionCues:cues};
    expect(measuredLessonCues(film)).toEqual(cues);
    expect(measuredLessonAsset('captions',film)?.body).toContain('00:00:00.400 --> 00:00:02.600\nWelcome to Elevate for Humanity. I');
  });
  it('does not fabricate transcript cues from untimed text or accept invalid timing', () => {
    expect(measuredLessonCues({measuredTranscript:'Recorded words only'})).toEqual([]);
    for (const captionCues of [
      [{start:2,end:1,text:'reversed'}],
      [{start:0,end:3,text:'first'},{start:2,end:4,text:'overlap'}],
      [{start:0,end:11,text:'out of bounds'}],
      [{start:0,end:1,text:'<script>markup</script>'}],
    ]) {
      const film={durationSeconds:10,captionCues};
      expect(measuredLessonCues(film)).toEqual([]);
      expect(measuredLessonAsset('captions',film)).toBeNull();
    }
  });
});
