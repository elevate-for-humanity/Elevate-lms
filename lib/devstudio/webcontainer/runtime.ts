/**
 * Canonical browser-local execution runtime for Dev Studio.
 * This is the only adapter allowed to talk to @webcontainer/api.
 */

type WebContainerInstance = Awaited<ReturnType<(typeof import('@webcontainer/api'))['WebContainer']['boot']>>;
type TreeNode = { file: { contents: string } } | { directory: Record<string, TreeNode> };

function toTree(files: Record<string, string>): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};
  for (const [rawPath, contents] of Object.entries(files)) {
    const parts = rawPath.replace(/^\/+/, '').split('/').filter(Boolean);
    let cursor = root;
    for (const part of parts.slice(0, -1)) {
      const current = cursor[part];
      if (!current || !('directory' in current)) cursor[part] = { directory: {} };
      cursor = (cursor[part] as { directory: Record<string, TreeNode> }).directory;
    }
    const filename = parts.at(-1);
    if (filename) cursor[filename] = { file: { contents } };
  }
  return root;
}

class DevStudioWebContainerRuntime {
  private instance: WebContainerInstance | null = null;
  private booting: Promise<WebContainerInstance> | null = null;

  isReady() {
    return this.instance !== null;
  }

  async boot() {
    if (typeof window === 'undefined') throw new Error('WebContainer can only boot in the browser');
    if (this.instance) return this.instance;
    this.booting ||= import('@webcontainer/api').then(({ WebContainer }) => WebContainer.boot());
    this.instance = await this.booting;
    return this.instance;
  }

  private async ready() {
    return this.instance ?? this.boot();
  }

  async mount(files: Record<string, string>) {
    const runtime = await this.ready();
    await runtime.mount(toTree(files) as never);
  }

  async writeFile(filePath: string, content: string) {
    const runtime = await this.ready();
    const normalized = filePath.replace(/^\/+/, '');
    const parent = normalized.split('/').slice(0, -1).join('/');
    if (parent) await runtime.fs.mkdir(parent, { recursive: true });
    await runtime.fs.writeFile(normalized, content);
  }

  async readFile(filePath: string) {
    const runtime = await this.ready();
    return runtime.fs.readFile(filePath.replace(/^\/+/, ''), 'utf-8');
  }

  async deleteFile(filePath: string) {
    const runtime = await this.ready();
    await runtime.fs.rm(filePath.replace(/^\/+/, ''), { recursive: true });
  }

  async rename(from: string, to: string) {
    const runtime = await this.ready();
    const normalizedTo = to.replace(/^\/+/, '');
    const parent = normalizedTo.split('/').slice(0, -1).join('/');
    if (parent) await runtime.fs.mkdir(parent, { recursive: true });
    await runtime.fs.rename(from.replace(/^\/+/, ''), normalizedTo);
  }
}

const runtime = new DevStudioWebContainerRuntime();

export function getRuntime() {
  return runtime;
}
