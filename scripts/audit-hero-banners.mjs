import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'public/data/hero-banners.json');
const outPath = path.join(root, 'docs/audits/hero-banner-audit.md');
const heroConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function localExists(url) {
  if (!url || !url.startsWith('/')) return null;
  return fs.existsSync(path.join(root, 'public', url.replace(/^\//, '')));
}

const rows = Object.entries(heroConfig).map(([key, value]) => {
  const desktop = value.videoSrcDesktop || '';
  const mobile = value.videoSrcMobile || '';
  const poster = value.posterImage || value.image || value.heroImage || '';
  const hasVideo = Boolean(desktop || mobile);
  const hasPicture = Boolean(poster);
  return {
    key,
    desktop,
    mobile,
    poster,
    hasVideo,
    hasPicture,
    posterExists: localExists(poster),
    primaryCta: value.primaryCta?.href || '',
    secondaryCta: value.secondaryCta?.href || '',
  };
});

function dup(field) {
  const uses = new Map();
  for (const row of rows) {
    const value = row[field];
    if (!value) continue;
    if (!uses.has(value)) uses.set(value, []);
    uses.get(value).push(row.key);
  }
  return [...uses.entries()].filter(([, keys]) => keys.length > 1).sort((a,b)=>b[1].length-a[1].length);
}

const duplicateDesktop = dup('desktop');
const duplicateMobile = dup('mobile');
const duplicatePoster = dup('poster');
const missingFallback = rows.filter((row) => !row.hasVideo && !row.hasPicture);
const badLocalPoster = rows.filter((row) => row.poster && row.posterExists === false);
const missingCta = rows.filter((row) => !row.primaryCta);

const tsxRoots = [path.join(root, 'apps/marketing/app'), path.join(root, 'components')];
function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.next','.git'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(?:tsx|jsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = tsxRoots.flatMap((dir)=>walk(dir));
const overlayHits = [];
for (const file of files) {
  const text = fs.readFileSync(file,'utf8');
  const hasHeroMedia = /<Image\b[^>]{0,120}\bfill\b|<video\b|HeroVideo|HeroPicture|hero/i.test(text);
  const hasFullOverlay = /(?:absolute\s+inset-0|inset-0\s+absolute)[^\n>]{0,220}(?:bg-gradient-to-|bg-black\/|from-black|from-slate-9|via-black|to-black)|(?:bg-gradient-to-|bg-black\/|from-black|from-slate-9|via-black|to-black)[^\n>]{0,220}(?:absolute\s+inset-0|inset-0\s+absolute)/i.test(text);
  if (hasHeroMedia && hasFullOverlay) {
    const lines = text.split('\n');
    const snippets = [];
    lines.forEach((line, i) => {
      if (/(?:absolute\s+inset-0|inset-0\s+absolute).*(?:bg-gradient-to-|bg-black\/|from-black|from-slate-9|via-black|to-black)|(?:bg-gradient-to-|bg-black\/|from-black|from-slate-9|via-black|to-black).*(?:absolute\s+inset-0|inset-0\s+absolute)/i.test(line)) {
        snippets.push(`${i+1}: ${line.trim()}`);
      }
    });
    overlayHits.push({
      file: path.relative(root,file).replaceAll('\\','/'),
      snippets: snippets.slice(0,5),
    });
  }
}

function table(headers, data) {
  const esc = (v) => String(v ?? '').replaceAll('|','\\|').replaceAll('\n',' ');
  return `| ${headers.join(' | ')} |\n| ${headers.map(()=> '---').join(' | ')} |\n` + data.map(row=>`| ${row.map(esc).join(' | ')} |`).join('\n');
}

let md = `# Hero banner audit\n\nGenerated: ${new Date().toISOString()}\n\n`;
md += `## Summary\n\n`;
md += `- Hero config entries: **${rows.length}**\n`;
md += `- Entries with video: **${rows.filter(r=>r.hasVideo).length}**\n`;
md += `- Picture-only entries: **${rows.filter(r=>!r.hasVideo&&r.hasPicture).length}**\n`;
md += `- Entries with neither video nor picture: **${missingFallback.length}**\n`;
md += `- Missing local poster/image files: **${badLocalPoster.length}**\n`;
md += `- Duplicate desktop video URLs: **${duplicateDesktop.length}**\n`;
md += `- Duplicate mobile video URLs: **${duplicateMobile.length}**\n`;
md += `- Duplicate poster/image URLs: **${duplicatePoster.length}**\n`;
md += `- Entries missing primary CTA: **${missingCta.length}**\n`;
md += `- Marketing/component files with full-image gradient/dark overlay pattern: **${overlayHits.length}**\n\n`;

md += `## Hero media matrix\n\n` + table(
  ['Key','Desktop video','Mobile video','Poster/image','Local poster exists','Primary CTA','Secondary CTA'],
  rows.map(r=>[r.key,r.desktop||'—',r.mobile||'—',r.poster||'—',r.posterExists===null?'remote/n-a':r.posterExists?'yes':'NO',r.primaryCta||'NO',r.secondaryCta||'—'])
) + '\n\n';

const dupSection = (title, values) => `## ${title}\n\n` + (values.length ? table(['Media','Keys'], values.map(([media,keys])=>[media,keys.join(', ')])) : 'None.') + '\n\n';
md += dupSection('Duplicate desktop video URLs', duplicateDesktop);
md += dupSection('Duplicate mobile video URLs', duplicateMobile);
md += dupSection('Duplicate poster/image URLs', duplicatePoster);
md += `## Missing fallback media\n\n${missingFallback.length ? missingFallback.map(r=>`- ${r.key}`).join('\n') : 'None.'}\n\n`;
md += `## Missing local poster/image assets\n\n${badLocalPoster.length ? badLocalPoster.map(r=>`- ${r.key}: ${r.poster}`).join('\n') : 'None.'}\n\n`;
md += `## Missing primary CTA\n\n${missingCta.length ? missingCta.map(r=>`- ${r.key}`).join('\n') : 'None.'}\n\n`;
md += `## Full-image overlay candidates\n\n`;
md += overlayHits.length ? overlayHits.map(hit=>`### ${hit.file}\n\n${hit.snippets.map(s=>`- \`${s}\``).join('\n') || '- Overlay pattern detected; inspect component context.'}`).join('\n\n') : 'None.';
md += '\n';

fs.mkdirSync(path.dirname(outPath), {recursive:true});
fs.writeFileSync(outPath, md);
console.log(JSON.stringify({entries:rows.length,missingFallback:missingFallback.length,badLocalPoster:badLocalPoster.length,duplicateDesktop:duplicateDesktop.length,duplicateMobile:duplicateMobile.length,duplicatePoster:duplicatePoster.length,missingCta:missingCta.length,overlayHits:overlayHits.length}, null, 2));
