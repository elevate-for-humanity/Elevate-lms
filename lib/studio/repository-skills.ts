import 'server-only';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Skill } from './skills-loader';

const SKILLS_ROOT = path.join(process.cwd(), '.agents', 'skills');
const MAX_SKILL_BYTES = 128 * 1024;

function field(frontmatter: string, name: string): string {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'mi'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function triggersFor(name: string, description: string): string[] {
  return [...new Set([
    name,
    name.replace(/-/g, ' '),
    ...description.toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) ?? [],
  ])].slice(0, 16);
}

export async function loadRepositorySkills(): Promise<Skill[]> {
  const entries = await readdir(SKILLS_ROOT, { withFileTypes: true }).catch(() => []);
  const skills: Skill[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(entry.name)) continue;
    const skillPath = path.join(SKILLS_ROOT, entry.name, 'SKILL.md');
    const content = await readFile(skillPath, 'utf8').catch(() => '');
    if (!content || Buffer.byteLength(content) > MAX_SKILL_BYTES) continue;
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) continue;
    const name = field(match[1], 'name') || entry.name;
    if (name !== entry.name) continue;
    const description = field(match[1], 'description');
    if (!description) continue;
    skills.push({
      name,
      description,
      triggers: triggersFor(name, description),
      content: match[2].trim(),
      category: 'workflow',
      icon: 'sparkles',
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
