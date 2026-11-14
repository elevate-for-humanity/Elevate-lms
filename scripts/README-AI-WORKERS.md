# Elevate AI Workers

These scripts automate image and video-job generation for https://www.elevateforhumanity.org.

## 1. Environment

Set your OpenAI API key (in Gitpod or locally):

```bash
export OPENAI_API_KEY="sk-..."
```

## 2. Generate website images from prompts

Prompts live in: `content/image-prompts/*.md`

Run:

```bash
node scripts/generate-images.mjs
```

What it does:

- reads every `.md` in `content/image-prompts`
- sends the text as a prompt to OpenAI's DALL-E 3 image model
- saves PNGs into `public/generated-images/{slug}.png`
- writes `public/generated-images/manifest.json` mapping slug → URL

You can then reference these in your Next.js app, for example:

```tsx
import manifest from '@/../public/generated-images/manifest.json';
const heroSrc = manifest['homepage-hero']; // "/generated-images/homepage-hero.png"
```

## 3. Prepare video jobs from scripts

Video scripts live in: `content/video-scripts/*.md`

Run:

```bash
node scripts/prepare-video-jobs.mjs
```

What it does:

- reads each `.md` video script
- guesses a reasonable duration
- writes `content/video-jobs.json` with an array of job objects

Example job:

```json
{
  "id": "homepage-hero",
  "title": "Homepage Hero Video (30–45 seconds)",
  "sourceFile": "content/video-scripts/homepage-hero.md",
  "prompt": "...full script text...",
  "targetProvider": "video_generation_service",
  "targetModel": "sora-or-provider-model",
  "durationSeconds": 40,
  "aspectRatio": "16:9",
  "voice": "default",
  "status": "pending"
}
```

You can plug `video-jobs.json` into:

- ONA / autopilot flows
- a Cloudflare Worker
- a backend API route

to actually call Sora (if you have access) or other tools like HeyGen, Synthesia, Pictory, D-ID, etc.

This keeps your content (scripts + prompts) in the repo and your automation layer free to swap providers.
