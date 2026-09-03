#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generate() {
  const prompt = `
Create a full "social media post pack" for ElevateConnectsDirectory.org.

The pack must include:
1. A short viral caption (under 100 chars)
2. A medium-length caption (FB, LinkedIn)
3. A TikTok-style script (20–30 seconds)
4. A vertical video commercial script (30–45 seconds)
5. 7 viral hashtag sets:
   - TikTok
   - Instagram
   - YouTube Shorts
   - Facebook
   - LinkedIn
6. A CTA to visit ElevateConnectsDirectory.org
7. The post must highlight:
   - Free or low-cost programs
   - WIOA funding
   - Elevate For Humanity
   - At least one program (HVAC, Barber, CDL, CNA, etc.)

Format the output in markdown with clear sections.
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0].message.content;

  const date = new Date().toISOString().split('T')[0];
  const outPath = path.join(process.cwd(), 'content', 'social-packs', `${date}-social-pack.md`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, text);
}

generate().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
