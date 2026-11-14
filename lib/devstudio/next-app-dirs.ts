import fs from 'node:fs';
import path from 'node:path';

export interface NextAppDir {
  dir: string;
  label: string;
}

function unique(paths: string[]) {
  return [...new Set(paths.map((p) => path.resolve(p)))];
}

function candidateRoots(cwd: string) {
  const roots = [path.resolve(cwd)];
  let current = path.resolve(cwd);
  for (let i = 0; i < 6; i += 1) {
    const parent = path.dirname(current);
    if (parent === current) break;
    roots.push(parent);
    current = parent;
  }
  return unique(roots);
}

function isDirectory(dir: string) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function getNextAppDirCandidates(cwd = process.cwd()) {
  const relCandidates = ['app', path.join('src', 'app'), path.join('apps', 'web', 'app'), path.join('apps', 'admin', 'app')];
  return unique(
    candidateRoots(cwd).flatMap((root) => relCandidates.map((rel) => path.join(root, rel)))
  );
}

export function discoverNextAppDirs(cwd = process.cwd()): NextAppDir[] {
  return getNextAppDirCandidates(cwd)
    .filter(isDirectory)
    .map((dir) => {
      const rel = path.relative(cwd, dir);
      return {
        dir,
        label: rel && !rel.startsWith('..') ? rel : dir,
      };
    });
}

export function describeCheckedAppDirs(cwd = process.cwd()) {
  return getNextAppDirCandidates(cwd).join(', ');
}
