import type { AIImageProvider, ImageGenerationOptions, GeneratedImage } from '../types';

/**
 * Stability AI (Stable Diffusion) provider for image generation.
 * Open-weight models — can run on-premise via their API or self-hosted.
 *
 * Requires:
 *   STABILITY_API_KEY
 *   STABILITY_API_HOST (optional, defaults to public API)
 */
export class StabilityProvider implements AIImageProvider {
  readonly name = 'stability' as const;

  private get apiKey() { return process.env.STABILITY_API_KEY || ''; }
  private get apiHost() { return process.env.STABILITY_API_HOST || 'https://api.stability.ai'; }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const [width, height] = (options.size || '1024x1024').split('x').map(Number);

    const res = await fetch(`${this.apiHost}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: options.prompt, weight: 1 }],
        cfg_scale: 7,
        width: Math.min(width, 1024),
        height: Math.min(height, 1024),
        samples: options.count || 1,
        steps: 30,
      }),
    });

    if (!res.ok) {
      throw new Error(`Stability AI returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.artifacts.map((artifact: any) => ({
      b64Json: artifact.base64,
    }));
  }
}
