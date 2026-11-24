import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { childExitStatus } from './build-memory-policy.mjs';

// Each root and each generated validation block is checked. Only the lifetime
// of the compiler graph changes; no diagnostics or compiler rules are disabled.
export function partitionValidator(text, batchSize = 300) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw Error('Invalid typecheck batch size');
  const source = ts.createSourceFile('validator.ts', text, ts.ScriptTarget.Latest, true);
  const blocks = source.statements.filter(ts.isBlock);
  const groups = [];
  for (let offset = 0; offset < blocks.length; offset += batchSize) {
    const selected = new Set(blocks.slice(offset, offset + batchSize));
    let cursor = 0;
    let output = '';
    for (const block of blocks) {
      output += text.slice(cursor, block.pos);
      const value = text.slice(block.pos, block.end);
      // Keep original line/column positions for meaningful diagnostics.
      output += selected.has(block) ? value : value.replace(/[^\r\n]/g, ' ');
      cursor = block.end;
    }
    groups.push(output + text.slice(cursor));
  }
  return groups.length ? groups : [text];
}

export function typecheckPlan(config, batchSize = 300, ambientFiles) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw Error('Invalid typecheck batch size');
  const globals = [...new Set([...config.fileNames.filter(file => file.endsWith('.d.ts')), ...(ambientFiles ?? config.fileNames.filter(file => {
    if (file.endsWith('.d.ts')) return true;
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    // Script globals and module augmentations must be visible in every group.
    return !ts.isExternalModule(source) || source.statements.some(statement =>
      ts.isModuleDeclaration(statement) && (statement.flags & ts.NodeFlags.GlobalAugmentation || ts.isStringLiteral(statement.name)));
  }))])];
  const validators = config.fileNames.filter(file => /[/\\]\.next[/\\]types[/\\]validator\.ts$/.test(file));
  const roots = config.fileNames.filter(file => !globals.includes(file) && !validators.includes(file));
  const jobs = [];
  for (let offset = 0; offset < roots.length; offset += batchSize)
    jobs.push({ files: [...globals, ...roots.slice(offset, offset + batchSize)] });
  for (const file of validators) {
    const pieces = partitionValidator(readFileSync(file, 'utf8'), batchSize);
    for (let piece = 0; piece < pieces.length; piece++)
      jobs.push({ files: [...globals, file], validator: file, piece });
  }
  return jobs.length ? jobs : [{ files: globals }];
}

function readConfig(cwd) {
  const path = ts.findConfigFile(cwd, ts.sys.fileExists);
  if (!path) throw Error(`No tsconfig.json in ${cwd}`);
  const config = ts.getParsedCommandLineOfConfigFile(path, {}, {
    ...ts.sys, onUnRecoverableConfigFileDiagnostic(diagnostic) {
      throw Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  });
  if (config.errors.length) throw Error(ts.formatDiagnosticsWithColorAndContext(config.errors, diagnosticHost));
  return config;
}
const diagnosticHost = { getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' };

function checkJob(config, job) {
  const started = Date.now();
  const options = { ...config.options, incremental: false, noEmit: true };
  delete options.tsBuildInfoFile;
  const host = ts.createCompilerHost(options);
  if (job.validator) {
    const content = partitionValidator(readFileSync(job.validator, 'utf8'))[job.piece];
    if (content === undefined) throw Error('Generated validator partition changed during validation');
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (file, version, ...rest) => resolve(file) === resolve(job.validator)
      ? ts.createSourceFile(file, content, version, true) : getSourceFile(file, version, ...rest);
  }
  const program = ts.createProgram({ rootNames: job.files, options, host, projectReferences: config.projectReferences });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticHost));
  console.info(`[typecheck] roots=${job.files.length} graph=${program.getSourceFiles().length} peakRSS=${Math.ceil(process.resourceUsage().maxRSS / 1024)}MiB elapsed=${Math.ceil((Date.now() - started) / 1000)}s diagnostics=${diagnostics.length}`);
  return diagnostics.length ? 2 : 0;
}

// Discover transitive ambient declarations in a separate process. Otherwise a
// module augmentation imported by one root could be missing in another group.
// Parsing the complete graph does not instantiate its expensive semantic types.
export function prepareTypecheck(cwd) {
  const config = readConfig(cwd);
  const options = { ...config.options, incremental: false, noEmit: true };
  delete options.tsBuildInfoFile;
  const graph = ts.createProgram({ rootNames: config.fileNames, options, projectReferences: config.projectReferences });
  const ambient = graph.getSourceFiles().filter(source => !ts.isExternalModule(source) || source.statements.some(statement =>
    ts.isModuleDeclaration(statement) && (statement.flags & ts.NodeFlags.GlobalAugmentation || ts.isStringLiteral(statement.name))))
    .map(source => source.fileName);
  return { rootCount: config.fileNames.length, jobs: typecheckPlan(config, 300, ambient) };
}

const runChild = args => new Promise((resolveCode, reject) => {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...args], { stdio: 'inherit', env: process.env });
  child.once('error', reject);
  child.once('exit', (code, signal) => resolveCode(childExitStatus(code, signal)));
});

export async function typecheckNextApp() {
  const directory = mkdtempSync(join(tmpdir(), 'elevate-types-'));
  const planFile = join(directory, 'plan.json');
  try {
    const prepared = await runChild(['--prepare', planFile]);
    if (prepared !== 0) return prepared;
    const plan = JSON.parse(readFileSync(planFile, 'utf8'));
    console.info(`[typecheck] ${plan.rootCount} configured roots; ${plan.jobs.length} sequential compiler processes`);
    for (let index = 0; index < plan.jobs.length; index++) {
      console.info(`[typecheck] checking group ${index + 1}/${plan.jobs.length}`);
      const code = await runChild(['--worker', planFile, String(index)]);
      if (code !== 0) return code;
    }
    return 0;
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv[2] === '--prepare') {
      const plan = prepareTypecheck(process.cwd());
      writeFileSync(process.argv[3], JSON.stringify(plan));
      console.info(`[typecheck] ambient scope discovered; planner peakRSS=${Math.ceil(process.resourceUsage().maxRSS / 1024)}MiB`);
    } else if (process.argv[2] === '--worker') {
      const config = readConfig(process.cwd());
      const plan = JSON.parse(readFileSync(process.argv[3], 'utf8'));
      const job = plan.jobs[Number(process.argv[4])];
      if (!job) throw Error('Invalid compiler group');
      process.exitCode = checkJob(config, job);
    } else {
      process.exitCode = await typecheckNextApp();
    }
  } catch (error) { console.error(error); process.exitCode = 1; }
}
