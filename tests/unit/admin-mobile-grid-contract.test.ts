import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

describe('Admin and Studio mobile grid contract', () => {
  it('does not force three-or-more columns at the base mobile breakpoint', () => {
    const matches = execFileSync(
      'rg',
      ['-l', 'className="[^"]*grid-cols-[3-9][^"]*"', 'apps/admin/app', 'components/studio', '--glob', '*.tsx'],
      { encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);

    const violations = matches.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return source.match(/className="[^"]*grid-cols-[3-9][^"]*"/g)
        ?.filter((value) => !/(?:sm|md|lg|xl):grid-cols-/.test(value))
        .map((value) => `${file}: ${value}`) || [];
    });

    expect(violations).toEqual([]);
  });
});
