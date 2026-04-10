/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const generatedPath = path.resolve(process.cwd(), 'scripts/generated/barber-course.generated.ts');
const targetPath = path.resolve(process.cwd(), 'lib/curriculum/blueprints/barber-apprenticeship.generated.ts');

function main(): void {
  if (!fs.existsSync(generatedPath)) {
    console.error(`Missing generated file: ${generatedPath}`);
    console.error('Run: pnpm course:generate first.');
    process.exit(1);
  }
  const content = fs.readFileSync(generatedPath, 'utf8');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Wrote: ${targetPath}`);
}

main();
