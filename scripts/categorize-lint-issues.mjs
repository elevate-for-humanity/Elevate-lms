#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const lintOutput = execSync('npm run lint 2>&1', {
  encoding: 'utf-8',
  maxBuffer: 10 * 1024 * 1024,
});

const categories = {
  parsingErrors: [],
  activeAppFiles: [],
  componentsFiles: [],
  scriptsFiles: [],
  libFiles: [],
  testFiles: [],
  archiveFiles: [],
};

const lines = lintOutput.split('\n');
let currentFile = null;

lines.forEach((line) => {
  if (line.startsWith('/workspaces/fix2/')) {
    currentFile = line.trim();
  } else if (line.includes('Parsing error') && currentFile) {
    const category =
      currentFile.includes('/.archive/') ||
      currentFile.includes('-old') ||
      currentFile.includes('-backup')
        ? 'archiveFiles'
        : currentFile.includes('/app/')
          ? 'activeAppFiles'
          : currentFile.includes('/components/')
            ? 'componentsFiles'
            : currentFile.includes('/scripts/')
              ? 'scriptsFiles'
              : currentFile.includes('/lib/')
                ? 'libFiles'
                : currentFile.includes('/test')
                  ? 'testFiles'
                  : 'other';

    if (!categories[category].includes(currentFile)) {
      categories[category].push(currentFile);
    }

    if (!categories.parsingErrors.includes(currentFile)) {
      categories.parsingErrors.push(currentFile);
    }
  }
});

if (categories.activeAppFiles.length > 0) {
  categories.activeAppFiles.forEach((f) => console.log(`  ${f}`));
}

writeFileSync('reports/lint-categorization.json', JSON.stringify(categories, null, 2));
