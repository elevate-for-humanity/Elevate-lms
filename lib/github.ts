import { Octokit } from '@octokit/rest';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';

export function getUserOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

// Exchange OAuth code for access token
export async function getAccessTokenWithCode(code: string) {
  const auth = createOAuthAppAuth({
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
  });

  const { token } = (await auth({ type: 'oauth-user', code })) as any;
  return token as string;
}

// Helper to get file language for Monaco editor
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    mdx: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    py: 'python',
    go: 'go',
    rs: 'rust',
  };

  return languageMap[ext || ''] || 'plaintext';
}

// Helper to check if file is a course file
export function isCourseFile(path: string): boolean {
  return (
    path.startsWith('content/courses/') ||
    path.startsWith('lms-content/') ||
    path.includes('/courses/')
  );
}

// Helper to get course files only
export function filterCourseFiles(files: string[]): string[] {
  return files.filter(isCourseFile);
}

// Helper to create Octokit instance with token from env
export function gh() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
}

// Helper to parse repo string into owner and name
export function parseRepo(repo: string) {
  const [owner, name] = repo.split('/');
  return { owner, name };
}
