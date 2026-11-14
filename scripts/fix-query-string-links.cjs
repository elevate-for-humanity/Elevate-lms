#!/usr/bin/env node
const fs = require('fs');

console.log('🔧 Fixing query string links...\n');

const files = ['./dist/flash-sale-store.html', './dist/READY_FOR_TRANSFER_index.html'];

files.forEach((file) => {
  if (!fs.existsSync(file)) return;

  let content = fs.readFileSync(file, 'utf8');

  // Replace query string links with base page
  content = content.replace(/\/pay\?program=ai-fundamentals/g, '/pay.html?program=ai-fundamentals');
  content = content.replace(/\/pay\?program=data-science/g, '/pay.html?program=data-science');
  content = content.replace(/\/pay\?program=cybersecurity/g, '/pay.html?program=cybersecurity');

  fs.writeFileSync(file, content);
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n✅ All query string links fixed\n');
