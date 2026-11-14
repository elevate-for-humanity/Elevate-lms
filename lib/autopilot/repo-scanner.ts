import { Octokit } from '@octokit/rest';

export async function scanRepo() {
  const client = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const res = await client.git.getTree({
    owner: 'elevateforhumanity',
    repo: 'fix2',
    tree_sha: 'main',
    recursive: 'true',
  });

  return res.data.tree.map((i) => i.path);
}
