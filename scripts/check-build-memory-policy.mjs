import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { nextBuildMemoryDefaults } from './build-memory-policy.mjs';
import { containerBuildPolicy, validateContainerProfiles } from './container-build-policy.mjs';

export async function checkBuildMemoryPolicy(root, { sourceOnly = false } = {}) {
  validateContainerProfiles(containerBuildPolicy, path => existsSync(join(root, path)));

  // Worker image tests are excluded by default to keep the production Docker
  // context minimal. Reject COPY of a test that .dockerignore still filters
  // out; this must fail at preflight instead of during a protected GCP build.
  const workerDocker = readFileSync(join(root, 'Dockerfile.ultimate-worker'), 'utf8');
  const dockerIgnore = readFileSync(join(root, '.dockerignore'), 'utf8')
    .split(/\r?\n/).map(line => line.trim());
  for (const match of workerDocker.matchAll(/^COPY\s+(tests\/worker\/[^\s]+)\s+\.\/tests\/worker\/\s*$/gm)) {
    const fixture = match[1];
    if (!existsSync(join(root, fixture))) throw new Error(`Worker image regression fixture missing: ${fixture}`);
    if (dockerIgnore.lastIndexOf('!tests') <= dockerIgnore.lastIndexOf('tests') ||
        dockerIgnore.lastIndexOf('!tests/worker') <= dockerIgnore.lastIndexOf('tests/*') ||
        dockerIgnore.lastIndexOf(`!${fixture}`) <= dockerIgnore.lastIndexOf('tests/worker/*')) {
      throw new Error(`Worker image fixture excluded by .dockerignore: ${fixture}`);
    }
  }
  const configs = [join(root, 'next.config.mjs')];
  const apps = [];
  const workflows = join(root, '.github/workflows');
  const registered = new Set(Object.values(containerBuildPolicy).map(profile => profile.dockerfile));
  let buildWorkflows = 0;
  if (existsSync(workflows)) for (const file of readdirSync(workflows).filter(name => /\.ya?ml$/.test(name))) {
    const source = readFileSync(join(workflows, file), 'utf8');
    if (/docker\/build-push-action@|\bgcloud\s+builds\s+submit\b|\bbuildctl\b|\bpodman\s+build\b/.test(source))
      throw new Error(`${file}: integrate this container builder with reviewed workload admission before use`);
    const commands = [...source.replace(/\\\r?\n\s*/g, ' ').matchAll(/\bdocker\s+(?:buildx\s+build|build)\b([^\r\n]*)/g)];
    if (!commands.length) continue;
    buildWorkflows++;
    if (!source.includes('node scripts/check-build-memory-policy.mjs'))
      throw new Error(`${file}: every container build needs automatic memory-policy admission`);
    for (const command of commands) {
      const argument = command[1].match(/(?:^|\s)(?:-f|--file)\s+([^\s]+)/)?.[1]?.replace(/["']/g, '');
      if (!argument) throw new Error(`${file}: an explicitly registered Dockerfile is required`);
      if (argument.includes('$')) {
        const matrixFiles = [...source.matchAll(/dockerfile:\s*(\S+)/g)].map(match => match[1]);
        if (!source.includes('container-build-policy.mjs') && (!matrixFiles.length || matrixFiles.some(path => !registered.has(path))))
          throw new Error(`${file}: dynamic Dockerfile selection needs the reviewed registry`);
      } else if (!registered.has(argument)) {
        throw new Error(`${file}: register ${argument} and its workload profile before building`);
      }
    }
  }
  for (const { dockerfile, family } of Object.values(containerBuildPolicy)) {
    const source = readFileSync(join(root, dockerfile), 'utf8');
    if (family !== 'next-web') continue;
    if (!source.includes('util-linux')) throw new Error(`${dockerfile}: kernel build-lock tooling is required`);
    let builder = false;
    for (const line of source.split(/\r?\n/)) {
      if (/^FROM\s/i.test(line)) builder = /\sAS\s+builder\s*$/i.test(line);
      if (builder && /^ENV\s+NODE_OPTIONS=.*max[-_]old[-_]space[-_]size/i.test(line))
        throw new Error(`${dockerfile}: hard-coded build heaps bypass shared defaults`);
    }
  }
  for (const entry of readdirSync(join(root, 'apps'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(root, 'apps', entry.name);
    const packagePath = join(directory, 'package.json');
    if (!existsSync(packagePath)) continue;
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    if (!pkg.dependencies?.next && !pkg.devDependencies?.next) continue;
    const configPath = ['mjs', 'js', 'cjs'].map(extension => join(directory, `next.config.${extension}`))
      .find(path => existsSync(path));
    if (!configPath) throw new Error(`${entry.name}: a checked shared-memory Next config is required`);
    if (!pkg.scripts?.build?.includes('run-bounded-build.mjs') || !pkg.scripts.build.includes('build-next-app.mjs'))
      throw new Error(`${entry.name}: builds must use the bounded, sequentially typechecked entry point`);
    if (!pkg.scripts?.prebuild?.includes('check-build-memory-policy.mjs'))
      throw new Error(`${entry.name}: automatic prebuild policy verification is required`);
    configs.push(configPath);
    apps.push(entry.name);
  }
  const previous = process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
  delete process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
  try {
    for (const path of configs) {
      const source = readFileSync(path, 'utf8');
      if (!source.includes('withBuildMemoryDefaults(') || !source.includes('build-memory-policy.mjs'))
        throw new Error(`${path}: inherit the shared build-memory preset`);
      if (sourceOnly) continue;
      const { default: config } = await import(pathToFileURL(path).href);
      for (const [key, value] of Object.entries(nextBuildMemoryDefaults)) {
        if (config.experimental?.[key] !== value) throw new Error(`${path}: unsafe ${key} build setting`);
      }
      if (config.typescript?.ignoreBuildErrors !== false)
        throw new Error(`${path}: direct builds must retain type-error enforcement`);
    }
  } finally {
    if (previous === undefined) delete process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
    else process.env.ELEVATE_SEQUENTIAL_TYPECHECK = previous;
  }
  return { nextApps: apps, nextConfigs: configs.length,
    googleImages: Object.keys(containerBuildPolicy).length, buildWorkflows, sourceOnly };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  checkBuildMemoryPolicy(root, { sourceOnly: process.argv.includes('--source-only') })
    .then(result => console.log('Build memory policy verified:', JSON.stringify(result)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
