#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// VIRAL TOPICS - High engagement, trending workforce themes
const VIRAL_TOPICS = [
  "Why employers are paying people $25+/hour to learn a trade - and you don't pay anything",
  "The government program that wiped out $10,000 in student debt for career changers",
  "I went from broke to employed in 8 weeks - here's exactly how",
  "Why Indiana is giving away free job training in 2025 - are you eligible?",
  "The hidden healthcare shortage that's creating 50,000 jobs - no degree needed",
  "Mom learns HVAC in her 40s, now makes $65K/year - full story",
  "WIOA funding: The best-kept secret for free job training in America",
  "These 3 careers pay $50K+ with only 12 weeks of training",
  "From unemployment to $28/hour: The workforce program changing lives",
  "Why beauty industry apprenticeships are the fastest way to $100K+ as a stylist",
  "The skills gap crisis: 3 million jobs available, nobody trained to do them",
  "How to get free healthcare certification (CNA, Phlebotomy, Medical Assistant)",
  "Trade school alternatives that cost $0 - thanks to WIOA funding",
  "Career change at 35, 45, 55: It's never too late, here's the proof",
  "The ROI of workforce training: Why $0 education = $50K+ salary"
];

// VIRAL HASHTAGS
const VIRAL_HASHTAGS = [
  '#workforcedevelopment', '#jobtraining', '#careerchange', '#WIOA',
  '#freeeducation', '#tradeslife', '#healthcarecareer', '#IndianaJobs',
  '#jobsearch', '#careeradvice', '#upskill', '#recareer', '#jobtraining',
  '#workplacelearning', '#employment', '#jobsearchtips', '#careercoach',
  '#professionaldevelopment', '#hiring', '#careeropportunity'
];

async function generateViralBlogPost() {
  const topic = VIRAL_TOPICS[Math.floor(Math.random() * VIRAL_TOPICS.length)];
  
  const prompt = `
Write a VIRAL blog post for Elevate for Humanity that will get shared thousands of times.

TITLE: ${topic}

CRITICAL VIRAL RULES:
1. HOOK in first 2 sentences - make them UNFORGETTABLE
2. Use "YOU" and "YOUR" constantly - make reader feel it's about THEM
3. Include specific numbers and statistics
4. Tell a mini-story or transformation
5. Use short paragraphs (1-2 sentences max)
6. Include emotional triggers: urgency, fear of missing out, hope
7. End with clear, simple call-to-action

STRUCTURE:
- BOLD attention-grabbing intro (3-4 sentences)
- "Here's the deal:" section with key facts
- "Why this matters NOW:" urgency section
- Success story snippet
- "How to qualify:" clear steps
- CTA to ElevateConnectsDirectory.org

FORMAT: Markdown with # for title, ## for sections, **bold** for emphasis

SEO: Include keywords naturally: job training, free training, career change, Indiana, workforce development, WIOA
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9, // More creative/viral
    max_tokens: 1200,
  });

  const content = response.choices[0].message.content;
  
  const titleMatch = content.match(/^# (.+)/);
  const title = titleMatch ? titleMatch[1] : topic;
  
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  
  // Add viral hashtags to frontmatter
  const frontmatter = `---
title: "${title}"
date: "${date}"
excerpt: "${content.substring(0, 180).replace(/[#*\n]/g, ' ').trim()}..."
category: "viral-content"
author: "Elevate for Humanity"
featured: true
viral_score: high
hashtags: "${VIRAL_HASHTAGS.slice(0, 10).join(' ')}"
---
`;
  
  const fullContent = frontmatter + content + '\n\n---\n\n**Share this post if it helped you!**\n\n' + VIRAL_HASHTAGS.slice(0, 15).join(' ');
  
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  fs.mkdirSync(blogDir, { recursive: true });
  
  const outPath = path.join(blogDir, filename);
  fs.writeFileSync(outPath, fullContent);
  
  console.log(`✅ VIRAL blog post: ${filename}`);
  console.log(`📈 Title: "${title}"`);
  return { filename, title, content };
}

async function generateViralReelScript(title, content) {
  const prompt = `
Create a VIRAL YouTube Shorts / Reel script from this blog post.

TITLE: ${title}

CONTENT: ${content}

VIRAL SHORT FORM VIDEO RULES:
1. OPEN with a SHOCKING hook (first 3 seconds must stop scrolling)
2. Use "POV:" format for relatability
3. Include 3-5 quick punchy points
4. End with URGENT CTA
5. Target 30-45 seconds

FORMAT:
[HOOK - 3 sec] - Something that makes people stop
[BODY - 30 sec] - Quick facts, transformation, proof
[CTA - 5 sec] - Follow, share, visit link

Make it feel like a friend giving you insider information!
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0, // Maximum creativity
    max_tokens: 800,
  });

  const script = response.choices[0].message.content;
  
  // Save reel script
  const reelsDir = path.join(process.cwd(), 'content', 'reels');
  fs.mkdirSync(reelsDir, { recursive: true });
  
  const date = new Date().toISOString().split('T')[0];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
  const outPath = path.join(reelsDir, `${date}-${slug}-reel.md`);
  
  const reelContent = `# VIRAL REEL SCRIPT
# Target: 30-45 seconds
# Platform: YouTube Shorts, Instagram Reels, TikTok

${script}

---
# VIRAL ELEMENTS CHECKLIST:
- [ ] HOOK is shocking/surprising
- [ ] Includes specific numbers/stats
- [ ] Ends with clear action
- [ ] Triggers emotion (hope, FOMO, curiosity)
`;
  
  fs.writeFileSync(outPath, reelContent);
  
  console.log(`✅ VIRAL reel script: ${path.basename(outPath)}`);
  return outPath;
}

async function generateYouTubeMetadata(title, content) {
  const prompt = `
Create YouTube SEO-optimized metadata for this video:

TITLE: ${title}

CONTENT SUMMARY: ${content.substring(0, 500)}

Generate:
1. SEO-optimized YouTube title (under 60 chars, includes keywords)
2. Compelling description (first 2 lines are crucial - include CTA, timestamps)
3. 15 viral hashtags (without # symbol)
4. 5 suggested video tags
5. Thumbnail suggestion (text overlays, emotion, colors)

FORMAT as JSON:
{
  "title": "...",
  "description": "...",
  "tags": [...],
  "hashtags": [...],
  "thumbnail_idea": "..."
}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const metadata = response.choices[0].message.content;
  
  const date = new Date().toISOString().split('T')[0];
  const metaPath = path.join(process.cwd(), 'content', 'reels', `${date}-youtube-metadata.json`);
  fs.writeFileSync(metaPath, metadata);
  
  console.log(`✅ YouTube metadata saved`);
  return metaPath;
}

async function main() {
  console.log('🚀 VIRAL CONTENT GENERATOR\n');
  console.log('Strategy: High-engagement topics + SEO optimization + Viral hooks\n');
  
  const blog = await generateViralBlogPost();
  await generateViralReelScript(blog.title, blog.content);
  await generateYouTubeMetadata(blog.title, blog.content);
  
  console.log('\n✨ VIRAL content ready!');
  console.log('📝 Review, film, and post!');
  console.log('🎯 Target: YouTube Shorts + Facebook + All platforms');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
