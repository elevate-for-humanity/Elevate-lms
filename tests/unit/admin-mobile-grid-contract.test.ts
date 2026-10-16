import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [file] : [];
  });
}

describe('Admin and Studio mobile grid contract', () => {
  it('does not force three-or-more columns at the base mobile breakpoint', () => {
    // Keep the same source contract without depending on an uninstalled runner binary.
    const matches = ['apps/admin/app', 'components/studio'].flatMap(sourceFiles);

    const violations = matches.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return source.match(/className="[^"]*grid-cols-[3-9][^"]*"/g)
        ?.filter((value) => !/(?:sm|md|lg|xl):grid-cols-/.test(value))
        .map((value) => `${file}: ${value}`) || [];
    });

    expect(violations).toEqual([]);
  });
});
