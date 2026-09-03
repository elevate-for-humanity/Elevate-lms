import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateAndSaveAudio } from '../../../../server/tts-service';

async function generateAudio() {
  const text = `HVAC stands for Heating, Ventilation, and Air Conditioning. These systems control the temperature, humidity, and air quality inside residential and commercial buildings.`;

  const outputPath = path.join(process.cwd(), 'courses/hvac/module1/output/test-audio.mp3');
  await generateAndSaveAudio(text, outputPath, { voice: 'onyx', speed: 0.95 });
  console.info('Audio generated:', outputPath);
}

generateAudio().catch((err) => {
  console.error('Audio generation failed:', err);
  process.exit(1);
});
