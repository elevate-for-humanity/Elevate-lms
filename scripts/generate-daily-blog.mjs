#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BLOG_TOPICS = [
  "workforce development opportunities in Indiana",
  "how to get free job training with WIOA funding",
  "healthcare career pathways and certifications",
  "trades careers: HVAC, welding, and construction",
  "beauty industry apprenticeships and licensing",
  "resume tips for career changers",
  "interview skills for adults returning to work",
  "financial aid options for job training programs",
  "success stories from workforce training graduates",
  "how to apply for Indiana workforce development programs"
];

async function generateBlogPost() {
  const topic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
  
  const prompt = `
Write a compelling, SEO-optimized blog post for Elevate for Humanity.

TOPIC: ${topic}

Requirements:
- 600-800 words
- Catchy title (H1)
- Introduction hook (first paragraph)
- 3-4 sections with H2 headers
- Include relevant keywords naturally
- End with call-to-action to visit ElevateConnectsDirectory.org
- Tone: professional, motivating, accessible

Format as markdown with:
# Title
## Section headers
Paragraph content
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0].message.content;
  
  // Extract title from content
  const titleMatch = content.match(/^# (.+)/);
  const title = titleMatch ? titleMatch[1] : topic;
  
  // Generate slug
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  
  // Add frontmatter
  const frontmatter = `---
title: "${title}"
date: "${date}"
excerpt: "${content.substring(0, 200).replace(/[#*]/g, '').trim()}..."
category: "workforce-development"
author: "Elevate for Humanity"
featured: true
---
`;
  
  const fullContent = frontmatter + content;
  
  // Save to blog directory
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  fs.mkdirSync(blogDir, { recursive: true });
  
  const outPath = path.join(blogDir, filename);
  fs.writeFileSync(outPath, fullContent);
  
  console.log(`✅ Generated blog post: ${filename}`);
  return filename;
}

async function generateReelFromBlog(blogPath) {
  const blogText = fs.readFileSync(blogPath, 'utf8');
  
  const prompt = `
Turn this blog post into a viral 30-second Instagram Reel script.
Format: energetic, fast-paced, vertical video style.

Include:
- HOOK (first 3 seconds - grab attention)
- 3 key points (bullet format)
- CTA (follow for more tips)

BLOG:
${blogText}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0].message.content;
  
  // Save reel script
  const reelsDir = path.join(process.cwd(), 'content', 'reels');
  fs.mkdirSync(reelsDir, { recursive: true });
  
  const blogName = path.basename(blogPath, '.md');
  const outPath = path.join(reelsDir, `${blogName}-reel.md`);
  fs.writeFileSync(outPath, content);
  
  console.log(`✅ Generated reel script: ${path.basename(outPath)}`);
  return outPath;
}

async function main() {
  console.log('🚀 Starting daily blog generation...\n');
  
  // Generate blog post
  const blogFile = await generateBlogPost();
  
  // Generate reel script from blog
  const blogPath = path.join(process.cwd(), 'content', 'blog', blogFile);
  await generateReelFromBlog(blogPath);
  
  console.log('\n✨ Daily content generation complete!');
  console.log('📝 Review and edit content before publishing.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
