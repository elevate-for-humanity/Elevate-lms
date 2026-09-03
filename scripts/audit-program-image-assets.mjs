import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'lib/images/programImages.ts');
const publicImages = path.join(root, 'public/images');
const outPath = path.join(root, 'docs/audits/program-image-assets.md');
const registry = fs.readFileSync(registryPath, 'utf8');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(?:png|jpe?g|webp|avif)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

const assetFiles = walk(publicImages).map((p) => '/' + path.relative(path.join(root, 'public'), p).replaceAll('\\', '/'));
const literalMatches = [...registry.matchAll(/(?:card|hero):\s*(?:`\$\{P\}\/([^`]+)`|'([^']+)'|"([^"]+)")/g)]
  .map((m) => m[1] ? `/images/pages/${m[1]}` : (m[2] || m[3]))
  .filter(Boolean);
const counts = new Map();
for (const p of literalMatches) counts.set(p, (counts.get(p) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, n]) => n > 1).sort((a,b)=>b[1]-a[1]);
const missing = [...new Set(literalMatches)].filter((p) => p.startsWith('/images/') && !assetFiles.includes(p));
const unifiedResolver = /export function getProgramHeroImage[\s\S]*?return getProgramCardImage\(slug\);/.test(registry);

const keywords = [
  'barber','cosmet','esthetic','nail','hvac','cdl','truck','cna','nurs','medical','phleb','pharmacy','sanit','cpr','electr','weld','plumb','construction','network','cyber','software','web','graphic','design','cad','business','office','project','bookkeep','account','entrepren','culinary','forklift','hospitality','technology','training'
];
const candidates = assetFiles.filter((p) => keywords.some((k) => p.toLowerCase().includes(k))).sort();

let md = '# Canonical program image asset audit\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;
md += `- Image assets scanned: **${assetFiles.length}**\n`;
md += `- Registry image assignments parsed: **${literalMatches.length}**\n`;
md += `- Duplicate registry assignments: **${duplicates.length}**\n`;
md += `- Registry paths missing from public/images: **${missing.length}**\n\n`;
md += '## Duplicate canonical assignments\n\n';
md += duplicates.length ? duplicates.map(([p,n])=>`- ${p} — ${n} assignments`).join('\n') : 'None.';
md += '\n\n## Missing registry assets\n\n';
md += missing.length ? missing.map((p)=>`- ${p}`).join('\n') : 'None.';
md += '\n\n## Relevant available image assets\n\n';
md += candidates.map((p)=>`- ${p}`).join('\n');
md += '\n';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md);
console.log(JSON.stringify({assets:assetFiles.length, assignments:literalMatches.length, duplicateAssignments:duplicates.length, missing:missing.length, unifiedCardAndHero:unifiedResolver, candidates:candidates.length}, null, 2));
if (duplicates.length || missing.length || !unifiedResolver) process.exitCode = 1;
