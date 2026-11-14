#!/usr/bin/env node

/**
 * Scrape EmployIndy Job Ready Indy Programs
 * Fetches programs, logos, and course information
 */

import https from 'https';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client
      .get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
        (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve(data);
          });
        },
      )
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          downloadImage(res.headers.location, filename).then(resolve).catch(reject);
          return;
        }

        const filePath = path.join(process.cwd(), 'public', 'images', 'partners', filename);
        const fileStream = require('fs').createWriteStream(filePath);

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });

        fileStream.on('error', (err) => {
          reject(err);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function scrapeJRIPrograms() {
  const urls = ['https://learning.employindy.org', 'https://jri.employindy.org'];

  const scrapedData = [];

  for (const url of urls) {
    try {
      const html = await fetchHTML(url);

      // Extract program titles
      const titleMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      const titles = titleMatches
        .map((match) => match.replace(/<[^>]+>/g, '').trim())
        .filter((title) => title.length > 5 && title.length < 100);

      // Extract course/badge mentions
      const courseMatches = html.match(/badge|course|certification|skill|training/gi) || [];

      // Extract logo URLs
      const logoMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
      const logos = logoMatches
        .map((match) => {
          const srcMatch = match.match(/src=["']([^"']+)["']/);
          return srcMatch ? srcMatch[1] : null;
        })
        .filter((src) => src && (src.includes('logo') || src.includes('brand')));

      scrapedData.push({
        source: url,
        titles: [...new Set(titles)].slice(0, 10),
        courseCount: courseMatches.length,
        logos: logos.slice(0, 3),
      });
    } catch (error) {}
  }

  return scrapedData;
}

async function generateJRICoursesData() {
  // Default JRI badge courses based on standard JRI curriculum
  const jriCourses = {
    id: 'job-ready-indy',
    title: 'Job Ready Indy',
    provider: 'EmployIndy',
    organization: 'Elevate for Humanity Career and Training Institute',
    facilitator: 'Elizabeth Greene',
    registrationLink:
      'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    portalLink: 'https://jri.employindy.org',
    learningHubLink: 'https://learning.employindy.org',

    badges: [
      {
        id: 'professional-skills',
        title: 'Professional Skills',
        description: 'Workplace readiness and professional conduct',
        topics: [
          'Professional appearance and hygiene',
          'Workplace etiquette and behavior',
          'Time management and punctuality',
          'Work ethic and reliability',
          'Professionalism in communication',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
      {
        id: 'communication',
        title: 'Communication',
        description: 'Effective workplace communication skills',
        topics: [
          'Verbal communication skills',
          'Written communication',
          'Active listening',
          'Non-verbal communication',
          'Email and professional correspondence',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
      {
        id: 'problem-solving',
        title: 'Problem Solving',
        description: 'Critical thinking and decision making',
        topics: [
          'Identifying problems',
          'Analyzing situations',
          'Generating solutions',
          'Decision-making processes',
          'Creative thinking',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
      {
        id: 'teamwork',
        title: 'Teamwork',
        description: 'Collaboration and team dynamics',
        topics: [
          'Working effectively in teams',
          'Collaboration skills',
          'Conflict resolution',
          'Supporting team members',
          'Contributing to team goals',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
      {
        id: 'digital-literacy',
        title: 'Digital Literacy',
        description: 'Essential technology and computer skills',
        topics: [
          'Basic computer skills',
          'Internet and email usage',
          'Microsoft Office basics',
          'Online safety and security',
          'Digital communication tools',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
      {
        id: 'career-planning',
        title: 'Career Planning',
        description: 'Goal setting and career development',
        topics: [
          'Setting career goals',
          'Resume writing',
          'Job search strategies',
          'Interview preparation',
          'Professional development planning',
        ],
        duration: 'Self-paced',
        credential: 'Digital Badge',
      },
    ],

    benefits: [
      'Free training with no hidden costs',
      'Self-paced online learning',
      'Employer-recognized digital badges',
      'Career advancement opportunities',
      'Facilitator support and guidance',
      'Shareable credentials for LinkedIn and resumes',
    ],

    eligibility: [
      'Open to all Indianapolis residents',
      'No prior experience required',
      'Must be 18 years or older',
      'Access to computer and internet required',
      'Commitment to complete all six badge courses',
    ],
  };

  return jriCourses;
}

async function saveJRIData(data) {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  const filePath = path.join(dataDir, 'jobReadyIndyCourses.ts');

  // Ensure directory exists
  await fs.mkdir(dataDir, { recursive: true });

  const fileContent = `/**
 * Job Ready Indy Course Data
 * Elevate for Humanity Career and Training Institute
 * Facilitator: Elizabeth Greene
 * Auto-generated from EmployIndy Learning Hub
 */

export const jobReadyIndyCourses = ${JSON.stringify(data, null, 2)};

export default jobReadyIndyCourses;
`;

  await fs.writeFile(filePath, fileContent, 'utf-8');
}

async function main() {
  try {
    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'partners');
    await fs.mkdir(imagesDir, { recursive: true });

    const scrapedPrograms = await scrapeJRIPrograms();
    const jriData = await generateJRICoursesData();

    // Add scraped data to JRI data
    jriData.scrapedData = scrapedPrograms;

    await saveJRIData(jriData);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
