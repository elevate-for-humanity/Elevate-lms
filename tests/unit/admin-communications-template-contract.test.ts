import { readFileSync } from 'node:fs';

const list = readFileSync('apps/admin/app/communications/templates/page.tsx', 'utf8');
const create = readFileSync('apps/admin/app/communications/templates/new/page.tsx', 'utf8');
const actions = readFileSync('apps/admin/app/communications/templates/actions.ts', 'utf8');

describe('Admin communication templates', () => {
  it('uses the real email_templates schema', () => {
    expect(list).toContain('template.key');
    expect(list).toContain('template.body');
    expect(list).not.toContain('template.name');
    expect(list).not.toContain('template.content');
  });

  it('has a working audited create action instead of a coming-soon stub', () => {
    expect(create).toContain('action={createCommunicationTemplate}');
    expect(create).not.toContain('coming soon');
    expect(actions).toContain("table: 'email_templates'");
    expect(actions).toContain("action: 'admin:communications:template:create'");
  });
});
