/* eslint-disable */
/**
 * Generate Sample Videos from Templates
 * Pre-generates videos for all templates for demo/testing purposes
 */

const videoTemplates: any[] = [];
import { generateVideo, VideoGenerationRequest } from './video-generator-v2';
import { defaultStorage } from './video-storage';
import path from 'path';
import fs from 'fs/promises';

async function generateTemplateVideos() {

  const results: Array<{
    template: string;
    status: 'success' | 'failed';
    videoPath?: string;
    error?: string;
  }> = [];

  for (let i = 0; i < videoTemplates.length; i++) {
    const template = videoTemplates[i];
    console.log(
      `Processing ${i + 1}/${videoTemplates.length}: ${template.name}`
    );

    try {
      // Convert template to video generation request
      const request: VideoGenerationRequest = {
        title: template.name,
        scenes: template.scenes.map((scene, idx) => ({
          id: `${template.id}-scene-${idx + 1}`,
          type: scene.type,
          duration: scene.duration,
          script: scene.script,
          voiceOver: scene.voiceOver,
          background: scene.background,
          textPosition: scene.textPosition,
          animation: scene.animation,
          image: scene.media?.url,
          textStyle: scene.textStyle,
        })),
        settings: {
          format: template.format || '16:9',
          resolution: '720p', // Use 720p for faster generation
          voiceOver: true,
          backgroundMusic: false,
          voice: 'alloy',
        },
        userId: 'template-generator',
      };

      const result = await generateVideo(request);

      if (result.status === 'completed' && result.videoPath) {

        // Copy to samples directory
        const samplesDir = path.join(process.cwd(), 'samples');
        await fs.mkdir(samplesDir, { recursive: true });

        const samplePath = path.join(samplesDir, `${template.id}.mp4`);
        await fs.copyFile(result.videoPath, samplePath);


        results.push({
          template: template.name,
          status: 'success',
          videoPath: samplePath,
        });
      } else {

        results.push({
          template: template.name,
          status: 'failed',
          error: result.error,
        });
      }
    } catch (error) {

      results.push({
        template: template.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Add delay between generations to avoid overwhelming the system
    if (i < videoTemplates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Print summary

  const successful = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'failed');


  if (successful.length > 0) {
    successful.forEach((r) => {
    });
  }

  if (failed.length > 0) {
    failed.forEach((r) => {
    });
  }


  // Create index file
  const indexPath = path.join(process.cwd(), 'samples', 'README.md');
  const indexContent = `# Sample Videos from Templates

Generated: ${new Date().toISOString()}

## Videos

${successful
  .map(
    (r) => `- **${r.template}**
  - File: \`${path.basename(r.videoPath!)}\`
  - Status: ✅ Generated
`
  )
  .join('\n')}

${
  failed.length > 0
    ? `## Failed

${failed
  .map(
    (r) => `- **${r.template}**
  - Error: ${r.error}
`
  )
  .join('\n')}`
    : ''
}

## Usage

These sample videos demonstrate the capabilities of the AI Video Builder templates.
Each video was generated using:
- Resolution: 720p
- Format: As specified in template
- Voice: Alloy (OpenAI TTS)
- Quality: Medium

To regenerate these videos, run:
\`\`\`bash
pnpm video:generate-samples
\`\`\`
`;

  await fs.writeFile(indexPath, indexContent);
}

// Run generation

setTimeout(() => {
  generateTemplateVideos()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}, 5000);
