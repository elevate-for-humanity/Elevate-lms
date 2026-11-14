#!/usr/bin/env node
/**
 * Add hero banners and images to all pages
 */

const fs = require('fs');
const path = require('path');

const placeholders = JSON.parse(fs.readFileSync('/tmp/placeholders.json', 'utf8'));

console.log('Adding hero banners to all pages...\n');

let updated = 0;

placeholders.pages.forEach((page) => {
  const filePath = page.file;

  if (!fs.existsSync(filePath)) {
    console.log(`Skip: ${filePath} (not found)`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has hero banner
  if (content.includes('bg-gradient-to-r') || content.includes('Hero Section')) {
    return;
  }

  const newContent = addHeroBanner(content, page);
  fs.writeFileSync(filePath, newContent, 'utf8');
  updated++;

  if (updated % 50 === 0) {
    console.log(`Updated ${updated} pages...`);
  }
});

console.log(`\n✅ Updated ${updated} pages with hero banners`);

function addHeroBanner(content, page) {
  const title = page.title || 'Page';
  const desc = page.description || 'Description';

  // Find the return statement
  const returnMatch = content.match(/return \(\s*<div className="min-h-screen[^>]*>/);
  if (!returnMatch) return content;

  const heroSection = `
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">${title}</h1>
            <p className="text-xl mb-8 text-blue-100">
              ${desc}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 text-lg">
                Get Started
              </Link>
              <Link href="/contact" className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
`;

  // Insert hero after opening div
  return content.replace(
    /return \(\s*<div className="min-h-screen[^>]*>/,
    (match) => match + heroSection,
  );
}
