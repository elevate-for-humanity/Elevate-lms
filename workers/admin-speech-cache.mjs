import { KokoroTTS } from 'kokoro-js';

try {
  const model = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
  for (const voice of ['am_michael', 'af_heart', 'af_sarah', 'bm_fable', 'am_puck']) {
    const audio = await model.generate('Wash your hands and clean the tools before the lesson.', { voice, speed: 1 });
    if (!(audio.audio ?? audio.data)?.length || audio.sampling_rate !== 24000)
      throw new Error('ADMIN_NARRATION_CACHE_INVALID:' + voice);
  }
  console.log('Admin narration model and all five instructor voices are ready.');
} catch (error) {
  console.error('ADMIN_NARRATION_CACHE_FAILED: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
