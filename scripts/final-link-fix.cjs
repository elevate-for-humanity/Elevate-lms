#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results = results.concat(findFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('🔧 Final link fixes...\n');

const htmlFiles = findFiles('./dist', '.html');
let fixed = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix program links
  if (content.includes('/programs/barber')) {
    content = content.replace(/\/programs\/barber/g, '/programs#barber');
    modified = true;
  }
  if (content.includes('/programs/building-tech')) {
    content = content.replace(/\/programs\/building-tech/g, '/programs#building-tech');
    modified = true;
  }

  // Fix asset references
  if (content.includes('./assets/logo.png')) {
    content = content.replace(/\.\/assets\/logo\.png/g, '/assets/logo.svg');
    modified = true;
  }

  // Fix apple-touch-icon
  if (content.includes('/apple-touch-icon.png')) {
    content = content.replace(/\/apple-touch-icon\.png/g, '/assets/logo.svg');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    fixed++;
  }
}

console.log(`✅ Fixed links in ${fixed} files`);

// Create missing program pages as anchors in main programs page
if (!fs.existsSync('./dist/programs.html')) {
  const programsPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Programs | Elevate for Humanity</title>
  <link rel="stylesheet" href="/assets/index.css">
  <script type="module" src="/assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
  <div id="barber"></div>
  <div id="building-tech"></div>
</body>
</html>`;
  fs.writeFileSync('./dist/programs.html', programsPage);
  console.log('✅ Created programs.html with anchors');
}

console.log('\n✅ All link fixes complete!');
