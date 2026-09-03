import { gh, parseRepo } from '@/lib/github';

export async function scanRepository(repo = 'elevateforhumanity/fix2', branch = 'main') {
  const { owner, name } = parseRepo(repo);
  const client = gh();

  const tree = await client.git.getTree({
    owner,
    repo: name,
    tree_sha: branch,
    recursive: 'true',
  });

  return tree.data.tree.filter((i) => i.type === 'blob').map((i) => i.path!);
}

export async function analyzeRepository(repo = 'elevateforhumanity/fix2', branch = 'main') {
  const files = await scanRepository(repo, branch);

  const analysis = {
    totalFiles: files.length,
    courses: files.filter((f) => f.startsWith('courses/')).length,
    components: files.filter((f) => f.includes('/components/')).length,
    pages: files.filter((f) => f.includes('/app/') && f.endsWith('.tsx')).length,
    api: files.filter((f) => f.includes('/api/') && f.endsWith('.ts')).length,
    styles: files.filter((f) => f.endsWith('.css') || f.endsWith('.scss')).length,
    config: files.filter((f) => f.endsWith('.json') || f.endsWith('.yaml')).length,
    markdown: files.filter((f) => f.endsWith('.md')).length,
  };

  return {
    files,
    analysis,
  };
}
