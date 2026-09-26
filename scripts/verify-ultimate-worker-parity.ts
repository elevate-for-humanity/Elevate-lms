import fs from 'node:fs';

const docker = fs.readFileSync('Dockerfile.ultimate-worker','utf8');
const provision = fs.readFileSync('scripts/northflank/provision-ultimate-worker.ts','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const allDeps = {...pkg.dependencies,...pkg.devDependencies};

const requiredDocker = [
  'node:22-bookworm-slim',
  'pnpm@10.28.2',
  'chromium',
  'ffmpeg',
  'espeak-ng',
  'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./',
  'COPY lib ./lib',
  'COPY server ./server',
  'COPY remotion-src ./remotion-src',
  'COPY public ./public',
  'REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium',
  'workers/ultimate-course-builder.ts',
];
const requiredDeps = ['@supabase/supabase-js','tsx','server-only','@remotion/bundler','@remotion/renderer','@remotion/licensing','remotion'];
const requiredProvision = [
  "NORTHFLANK_GIT_BRANCH||'main'",
  "deploymentPlan:'nf-compute-400'",
  'storageSize:16384',
  'shmSize:64',
  "AI_PROVIDER:'cloudflare'",
  "ULTIMATE_WORKER_ID:'northflank-ultimate-worker'",
];

const missing = [
  ...requiredDocker.filter(x=>!docker.includes(x)).map(x=>'docker:'+x),
  ...requiredDeps.filter(x=>!allDeps[x]).map(x=>'dependency:'+x),
  ...requiredProvision.filter(x=>!provision.includes(x)).map(x=>'provision:'+x),
];
if(missing.length){
  console.error('Ultimate worker parity FAILED:',missing);
  process.exit(1);
}
console.log('Ultimate worker parity PASS: main + Docker runtime + dependencies + 16GB storage + 64MB shm + nf-compute-400');
