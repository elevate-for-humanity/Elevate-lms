import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { INDIVIDUAL_APP_CATALOG } from '../lib/apps/individual-app-plans';
import { commercialSnapshot } from '../lib/store/subscription-commercials';

const root = resolve(process.cwd()),
  screenDir = process.argv[2];
if (!screenDir)
  throw Error(
    'Usage: pnpm exec tsx scripts/render-store-commercials.ts <directory of verified slug-plan.jpg workspace captures>',
  );
const out = join(root, 'public/videos/store-subscriptions'),
  work = join(root, '.next/store-commercial-render');
mkdirSync(out, { recursive: true });
mkdirSync(work, { recursive: true });
const run = (tool: string, args: string[]) =>
  execFileSync(tool, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000 });
const duration = (path: string) =>
  Number(
    run('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      path,
    ]).trim(),
  );
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  );
const lines = (text: string, max = 44) => {
  const result: string[] = [];
  for (const word of text.split(/\s+/)) {
    if (!result.length || result[result.length - 1].length + word.length + 1 > max)
      result.push(word);
    else result[result.length - 1] += ' ' + word;
  }
  return result;
};
const text = (s: string, x: number, y: number, size: number, color = '#fff', max = 44) =>
  lines(s, max)
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * size * 1.23}" fill="${color}" font-family="DejaVu Sans" font-size="${size}" font-weight="700">${escape(line)}</text>`,
    )
    .join('');
const hook: Record<string, string> = {
  'sam-gov': 'Keep your business ready for the next registration review.',
  grants: 'Find opportunities. Keep your next application organized.',
  'website-builder': 'Your business deserves a website that gets you seen.',
};
async function narration(script: string) {
  const hash = createHash('sha256').update(script).digest('hex').slice(0, 24),
    path = join(work, hash + '.mp3');
  if (!existsSync(path)) {
    const response = await fetch('https://www.elevateforhumanity.org/api/voice/natural', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: script, style: 'commercial' }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('audio/'))
      throw Error('Natural commercial narration unavailable; no substitute video was generated.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 2000) throw Error('Narration is empty');
    writeFileSync(path, bytes);
  }
  const seconds = duration(path);
  if (!Number.isFinite(seconds) || seconds < 1) throw Error('Narration duration invalid');
  return { path, seconds };
}
const time = (s: number) =>
  new Date(Math.round(s * 1000)).toISOString().slice(11, 23).replace('.', '.');
const manifest: Record<string, any> = {};
for (const catalog of Object.values(INDIVIDUAL_APP_CATALOG))
  for (const plan of catalog.plans) {
    const id = `${catalog.slug}-${plan.id}`,
      screenshot = resolve(screenDir, `${id}.jpg`);
    if (!existsSync(screenshot))
      throw Error(
        `Missing actual ${id} workspace capture. No unrelated image or placeholder is substituted.`,
      );
    const photo = join(root, 'public/images/store-commercials', catalog.slug + '.webp');
    if (!existsSync(photo)) throw Error('Product-specific commercial scene missing');
    const workflow =
      catalog.slug === 'sam-gov'
        ? 'Add your business record. Keep assigned U E I and CAGE details, registration status, renewal dates and supporting documents together in one workspace.'
        : catalog.slug === 'grants'
          ? `Search federal opportunities, review deadlines, and save relevant grants.${plan.id !== 'starter' ? ' Track applications, budget narratives, requested amounts and notes in the same workspace.' : ''}`
          : 'Describe your business and turn your ideas into a website preview. Refine your services, photos and calls to action. Sign in to save and publish your own site.';
    const ending =
      catalog.slug === 'sam-gov'
        ? 'Final registration and approval stay with the official SAM dot gov system.'
        : catalog.slug === 'grants'
          ? 'Final applications and funding decisions stay with the awarding agency.'
          : '';
    const scenes = [
      {
        kind: 'photo',
        title: hook[catalog.slug],
        script: `${hook[catalog.slug]} Meet Elevate ${catalog.displayName}. Practical software for your next business step.`,
      },
      { kind: 'screen', title: 'See the actual workspace', script: workflow },
      {
        kind: 'plan',
        title: `${plan.name} · ${plan.priceLabel}`,
        script: `Choose ${plan.name} at ${plan.priceMonthly} dollars per month. This individual plan includes ${plan.features.join('. ')}.`,
      },
      {
        kind: 'photo',
        title: 'Try it. Choose your plan. Get to work.',
        script: `Explore the interactive demo and start your fourteen day trial with no card required. When you are ready, pay your invoice securely through QuickBooks. ${ending}`,
      },
    ];
    const segments: string[] = [];
    let elapsed = 0,
      captions = 'WEBVTT\n\n';
    for (let index = 0; index < scenes.length; index++) {
      const scene = scenes[index],
        audio = await narration(scene.script),
        seconds = audio.seconds + 0.35,
        frame = join(work, `${id}-${index}.png`),
        clip = join(work, `${id}-${index}.mp4`);
      let image: Buffer;
      if (scene.kind === 'screen')
        image = await sharp(screenshot)
          .resize(1280, 720, { fit: 'contain', background: '#101216' })
          .png()
          .toBuffer();
      else image = await sharp(photo).resize(1280, 720, { fit: 'cover' }).png().toBuffer();
      const frameText =
        scene.kind === 'plan'
          ? `<rect width="1280" height="720" fill="#101216" fill-opacity=".9"/>${text(catalog.displayName, 60, 95, 30, '#f1d48a')}${text(scene.title, 60, 165, 47)}${plan.features
              .flatMap((f) => lines(f, 65))
              .map((f, i) => text('• ' + f, 64, 245 + i * 40, 26, '#fff', 90))
              .join('')}`
          : scene.kind === 'screen'
            ? `<rect width="1280" height="55" fill="#101216"/>${text('ELEVATE · ' + catalog.displayName + ' · ' + plan.name + ' workspace preview', 28, 36, 22)}<rect y="675" width="1280" height="45" fill="#101216"/>${text('Interactive demo · Example records · Explore every control in the Store', 28, 705, 18, '#f1d48a')}`
            : `<rect y="370" width="1280" height="350" fill="#101216" fill-opacity=".86"/>${text('ELEVATE FOR HUMANITY', 55, 418, 22, '#f1d48a')}${text(scene.title, 55, 485, 46, '#fff', 43)}${text(catalog.displayName + ' · ' + plan.name + ' · ' + plan.priceLabel, 55, 620, 25)}${text('store.elevateforhumanity.org', 55, 674, 22, '#f1d48a')}`;
      await sharp(image)
        .composite([
          {
            input: Buffer.from(
              `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">${frameText}</svg>`,
            ),
          },
        ])
        .png()
        .toFile(frame);
      const vf =
        scene.kind === 'photo'
          ? `zoompan=z='min(zoom+0.00006,1.04)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1280x720:fps=24,fade=t=in:st=0:d=0.2,fade=t=out:st=${Math.max(0, seconds - 0.2)}:d=0.2,format=yuv420p`
          : 'format=yuv420p';
      run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-loop',
        '1',
        '-framerate',
        '24',
        '-i',
        frame,
        '-i',
        audio.path,
        '-vf',
        vf,
        '-af',
        'loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.35',
        '-t',
        String(seconds),
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '25',
        '-threads',
        '2',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-ar',
        '48000',
        '-movflags',
        '+faststart',
        clip,
      ]);
      segments.push(clip);
      captions += `${index + 1}\n${time(elapsed)} --> ${time(elapsed + seconds)}\n${scene.script}\n\n`;
      elapsed += seconds;
      if (index === 0)
        await sharp(frame)
          .jpeg({ quality: 88 })
          .toFile(join(out, id + '.jpg'));
    }
    const concat = join(work, id + '.concat');
    writeFileSync(concat, segments.map((p) => `file '${p}'`).join('\n'));
    const target = join(out, id + '.mp4'),
      temporary = join(work, id + '-final.mp4');
    run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concat,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      temporary,
    ]);
    const proof = JSON.parse(
      run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', temporary]),
    );
    if (
      !proof.streams.some(
        (s: any) =>
          s.codec_type === 'video' &&
          s.codec_name === 'h264' &&
          s.width === 1280 &&
          s.height === 720,
      ) ||
      !proof.streams.some((s: any) => s.codec_type === 'audio' && s.codec_name === 'aac') ||
      Number(proof.format.duration) < 15
    )
      throw Error('Commercial media validation failed');
    renameSync(temporary, target);
    writeFileSync(join(out, id + '.vtt'), captions);
    manifest[id] = {
      snapshot: commercialSnapshot(catalog, plan),
      src: `/videos/store-subscriptions/${id}.mp4`,
      poster: `/videos/store-subscriptions/${id}.jpg`,
      captions: `/videos/store-subscriptions/${id}.vtt`,
      transcript: scenes.map((s) => s.script).join('\n\n'),
      duration: Number(proof.format.duration),
    };
    console.log(
      JSON.stringify({
        commercial: id,
        duration: manifest[id].duration,
        video: 'h264',
        audio: 'aac',
        captions: true,
      }),
    );
  }
const manifestPath = join(root, 'config/store-commercials.json');
writeFileSync(manifestPath + '.pending', JSON.stringify(manifest, null, 2) + '\n');
renameSync(manifestPath + '.pending', manifestPath);
