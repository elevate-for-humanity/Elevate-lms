#!/usr/bin/env node
const audit = require('./audit-report.json');
const broken = audit.details.links.broken.filter(
  (l) =>
    !l.href.startsWith('mailto:') &&
    !l.href.startsWith('tel:') &&
    !l.href.startsWith('sms:') &&
    !l.href.includes('#') &&
    !l.href.startsWith('http') &&
    !l.href.includes('{{') &&
    !l.href.includes('${'),
);

console.log(`Remaining ${broken.length} internal broken links:\n`);
const unique = {};
broken.forEach((l) => {
  unique[l.href] = (unique[l.href] || 0) + 1;
});

Object.entries(unique)
  .sort((a, b) => b[1] - a[1])
  .forEach(([href, count]) => {
    console.log(`  ${href} (${count}x)`);
  });
