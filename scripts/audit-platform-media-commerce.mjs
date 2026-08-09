import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs/audits/platform-media-commerce-scan.md');
const SRC_ROOTS = ['apps', 'components', 'lib', 'data', 'content'];
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', 'build', '.git', 'coverage'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

const files = SRC_ROOTS.flatMap((r) => walk(path.join(ROOT, r)));
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');
const read = (p) => fs.readFileSync(p, 'utf8');
const records = files.map((p) => ({ path: rel(p), text: read(p) }));

const mediaRe = /(?:src|poster|image|imageUrl|image_url|heroImage|hero_image|thumbnail|thumbnail_url)\s*[:=]\s*[`'"]([^`'"]+\.(?:png|jpe?g|webp|avif|gif|mp4|webm))/gi;
const urlRe = /[`'"]([^`'"]+\.(?:png|jpe?g|webp|avif|gif|mp4|webm))[`'"]/gi;
const overlayRe = /bg-gradient-to-|from-black(?:\/\d+)?|via-black(?:\/\d+)?|to-black(?:\/\d+)?|bg-black\/\d+|absolute\s+inset-0[^\n]{0,180}(?:bg-|gradient)|mix-blend-|backdrop-brightness-|opacity-(?:[1-9]\d?|100)/i;
const lightTextRe = /text-(?:slate|gray|zinc|neutral)-(?:300|400|500)\b|text-white\/(?:[1-6]\d|70)\b|opacity-(?:40|50|60)\b/;
const genericSymbolRe = /(?:from\s+['"]lucide-react['"]|[>\s][•✓★☆◆◇→←↗↘⚠⚡☎✉✂][<\s]|emoji|Icon\s*=|icon:\s*[A-Z])/i;
const ctaRe = /(?:href|router\.push|window\.location\.assign)\s*=?.{0,80}(?:\/apply|\/enroll|checkout|payment|bnpl)|\b(?:Apply Now|Enroll Now|Get Started|Start Application|Pay Now|Buy Now|Compare BNPL)\b/i;
const bnplRe = /\bbnpl\b|buy now.?pay later|klarna|affirm|afterpay|payment plan|installment/i;
const cartRe = /\bcart\b|addToCart|add-to-cart|checkout/i;
const calcRe = /payment calculator|tuition calculator|monthly payment|payment estimate|calculatePayment|financing calculator/i;
const appSubmitRe = /fetch\([^\n]*(?:\/api\/[^'"`) ]*(?:apply|application|enroll|host-shop)|applications)|axios\.(?:post|put)\([^\n]*(?:apply|application|enroll)/i;
const formRe = /<form\b|onSubmit=|type=['"]submit['"]/i;
const ssnRe = /\bssn\b|social security/i;
const idUploadRe = /government[- ]issued id|photo id|driver.?s license|state id|identity document|id upload/i;

function extractMedia(text) {
  const set = new Set();
  for (const re of [mediaRe, urlRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) set.add(m[1]);
  }
  return [...set];
}

const programPages = records.filter((r) => /^apps\/marketing\/app\/(?:programs|apprenticeship|apprenticeships|training)\/.+\/page\.(?:t|j)sx?$/.test(r.path));
const programCards = records.filter((r) => /program/i.test(path.basename(r.path)) && /card|grid|catalog|listing|program/i.test(r.path) && /tsx?$/.test(r.path));
const applicationFiles = records.filter((r) => /(?:apply|application|enroll)/i.test(r.path) && /(?:tsx?|jsx?)$/.test(r.path));
const serviceFiles = records.filter((r) => /pwa|service.?worker|manifest|sw-/i.test(r.path));

const heroRows = programPages.map((r) => {
  const media = extractMedia(r.text);
  return {
    path: r.path,
    video: /<video\b|\.mp4|\.webm/i.test(r.text),
    image: /<Image\b|<img\b|\.(?:png|jpe?g|webp|avif)/i.test(r.text),
    overlay: overlayRe.test(r.text),
    media,
    cta: ctaRe.test(r.text),
    bnpl: bnplRe.test(r.text),
    light: lightTextRe.test(r.text),
    generic: genericSymbolRe.test(r.text),
  };
});

const mediaUse = new Map();
for (const r of records) {
  for (const m of extractMedia(r.text)) {
    if (!mediaUse.has(m)) mediaUse.set(m, []);
    mediaUse.get(m).push(r.path);
  }
}
const duplicateMedia = [...mediaUse.entries()]
  .filter(([m, ps]) => ps.length > 1 && /(?:hero|program|course|pages|banner|training|barber|cna|cdl|hvac|medical|nail|esthetic|cosmet)/i.test(m + ' ' + ps.join(' ')))
  .sort((a, b) => b[1].length - a[1].length);

const applicationRows = applicationFiles
  .filter((r) => formRe.test(r.text) || appSubmitRe.test(r.text))
  .map((r) => ({
    path: r.path,
    form: formRe.test(r.text),
    submit: appSubmitRe.test(r.text),
    ssn: ssnRe.test(r.text),
    id: idUploadRe.test(r.text),
    upload: /type=['"]file['"]|FormData\(|upload/i.test(r.text),
    network: /Network error|Failed to fetch|Service Unavailable|503/i.test(r.text),
  }));

const commerceRows = records
  .filter((r) => /(?:payment|checkout|cart|bnpl|tuition|pricing|calculator)/i.test(r.path) || bnplRe.test(r.text) || cartRe.test(r.text) || calcRe.test(r.text))
  .map((r) => ({ path: r.path, bnpl: bnplRe.test(r.text), cart: cartRe.test(r.text), calc: calcRe.test(r.text), stripe: /stripe/i.test(r.text), api: /\/api\//.test(r.text) }));

const swRows = serviceFiles.map((r) => ({
  path: r.path,
  register: /serviceWorker\.register|PwaRegistration|PWAInit|AdminPwaRegister/i.test(r.text),
  manifest: /manifest/i.test(r.text),
  sw: /service.?worker|sw-[a-z]+\.js|self\.addEventListener\(['"](?:install|fetch|activate)/i.test(r.text),
}));

const cardRows = programCards.map((r) => ({
  path: r.path,
  image: /<Image\b|<img\b|image(?:Url|_url)?\b|thumbnail/i.test(r.text),
  generic: genericSymbolRe.test(r.text),
  light: lightTextRe.test(r.text),
}));

const lightRows = records.filter((r) => lightTextRe.test(r.text)).map((r) => r.path);
const overlayRows = records.filter((r) => /hero|banner/i.test(r.path + ' ' + r.text.slice(0, 5000)) && overlayRe.test(r.text)).map((r) => r.path);
const genericRows = records.filter((r) => /program|course|hero|card/i.test(r.path) && genericSymbolRe.test(r.text)).map((r) => r.path);

function table(headers, rows) {
  const esc = (v) => String(v).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n` + rows.map((row) => `| ${row.map(esc).join(' | ')} |`).join('\n');
}

let md = `# Platform media, commerce, application & PWA audit\n\nGenerated: ${new Date().toISOString()}\n\n`;
md += `## Summary\n\n`;
md += `- Source files scanned: **${records.length}**\n`;
md += `- Program/training page files found: **${programPages.length}**\n`;
md += `- Program pages with detected gradient/dark overlays: **${heroRows.filter(x=>x.overlay).length}**\n`;
md += `- Program pages with no detected image/video media: **${heroRows.filter(x=>!x.image&&!x.video).length}**\n`;
md += `- Program pages with no detected CTA: **${heroRows.filter(x=>!x.cta).length}**\n`;
md += `- Program pages with no detected BNPL/payment-plan language: **${heroRows.filter(x=>!x.bnpl).length}**\n`;
md += `- Duplicate program/hero media literals: **${duplicateMedia.length}**\n`;
md += `- Application/form implementation files: **${applicationRows.length}**\n`;
md += `- Application files with SSN language: **${applicationRows.filter(x=>x.ssn).length}**\n`;
md += `- Application files with government/photo ID language: **${applicationRows.filter(x=>x.id).length}**\n`;
md += `- Commerce/payment/cart/calculator files: **${commerceRows.length}**\n`;
md += `- PWA/service-worker/manifest files: **${swRows.length}**\n`;
md += `- Files with potentially light text classes: **${lightRows.length}**\n\n`;

md += `## Program/training page media matrix\n\n` + table(
  ['Page', 'Video', 'Image', 'Overlay', 'CTA', 'BNPL', 'Light text', 'Generic icon/symbol', 'Media literals'],
  heroRows.map(x => [x.path, x.video?'yes':'no', x.image?'yes':'no', x.overlay?'YES':'no', x.cta?'yes':'NO', x.bnpl?'yes':'NO', x.light?'yes':'no', x.generic?'yes':'no', x.media.join('<br>') || '—'])
) + '\n\n';

md += `## Duplicate media literals\n\n` + (duplicateMedia.length ? table(['Media', 'Files'], duplicateMedia.slice(0,150).map(([m,ps])=>[m, ps.join('<br>')])) : 'None detected.') + '\n\n';

md += `## Program card/catalog candidates\n\n` + table(['File','Has image binding','Generic icon/symbol','Potential light text'], cardRows.map(x=>[x.path,x.image?'yes':'NO',x.generic?'yes':'no',x.light?'yes':'no'])) + '\n\n';

md += `## Application submission matrix\n\n` + table(['File','Form','Detected submit API','SSN','ID requirement','Upload','Network/503 copy'], applicationRows.map(x=>[x.path,x.form?'yes':'no',x.submit?'yes':'NO',x.ssn?'yes':'NO',x.id?'yes':'NO',x.upload?'yes':'no',x.network?'yes':'no'])) + '\n\n';

md += `## Commerce / BNPL / cart / calculator inventory\n\n` + table(['File','BNPL','Cart/checkout','Calculator','Stripe','API reference'], commerceRows.map(x=>[x.path,x.bnpl?'yes':'no',x.cart?'yes':'no',x.calc?'yes':'no',x.stripe?'yes':'no',x.api?'yes':'no'])) + '\n\n';

md += `## PWA / service-worker inventory\n\n` + table(['File','Registration','Manifest','Service worker'], swRows.map(x=>[x.path,x.register?'yes':'no',x.manifest?'yes':'no',x.sw?'yes':'no'])) + '\n\n';

md += `## Hero/banner files with overlay patterns\n\n` + overlayRows.map(x=>`- ${x}`).join('\n') + '\n\n';
md += `## Program/course/card files with generic icon/symbol patterns\n\n` + genericRows.slice(0,300).map(x=>`- ${x}`).join('\n') + '\n\n';
md += `## Files with potentially light text classes\n\n` + lightRows.slice(0,500).map(x=>`- ${x}`).join('\n') + '\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(JSON.stringify({files: records.length, programPages: programPages.length, overlays: heroRows.filter(x=>x.overlay).length, missingMedia: heroRows.filter(x=>!x.image&&!x.video).length, duplicateMedia: duplicateMedia.length, applicationFiles: applicationRows.length, commerceFiles: commerceRows.length, pwaFiles: swRows.length}, null, 2));
