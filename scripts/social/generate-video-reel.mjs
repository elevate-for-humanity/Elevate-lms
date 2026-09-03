#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateReel(blogText) {
  const prompt = `
Turn the blog below into a viral 30–40 second vertical commercial script.
Tone: energetic, motivating, fast-paced.
Audience: Indiana adults 18–55 looking for career advancement.

Include:
- Big bold hook (first 3 seconds)
- Fast bullet points (visual text overlays)
- Why the program matters
- Why WIOA makes it FREE
- Call to action for ElevateConnectsDirectory.org

Format as a video script with:
[HOOK] - First 3 seconds
[BODY] - Main content with bullet points
[CTA] - Call to action

BLOG:
${blogText}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content;
}

async function main() {
  const blogDir = path.join(process.cwd(), 'content', 'blog');

  if (!fs.existsSync(blogDir)) {
    console.error('❌ Blog directory not found. Create a blog post first.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No blog posts found. Create a blog post first.');
    process.exit(1);
  }

  const latest = files[0];

  const blogText = fs.readFileSync(path.join(blogDir, latest), 'utf8');
  const reelScript = await generateReel(blogText);

  const outputDir = path.join(process.cwd(), 'content', 'reels');
  fs.mkdirSync(outputDir, { recursive: true });

  const outPath = path.join(outputDir, latest.replace('.md', '-reel.md'));
  fs.writeFileSync(outPath, reelScript);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
