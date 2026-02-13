import { getRuntime } from '../webcontainer/runtime';

export interface FileEntry {
  path: string;
  content: string;
  sha?: string;
}

export interface DirtyFile {
  path: string;
  content: string;
  originalContent: string;
  isNew: boolean;
  isDeleted: boolean;
}

// Files to skip when loading from GitHub (large/generated)
const SKIP_PATTERNS = [
  'node_modules/',
  '.git/',
  '.next/',
  'dist/',
  'build/',
  '.turbo/',
  '.netlify/',
  'coverage/',
  '*.lock',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
];

function shouldSkipFile(path: string): boolean {
  return SKIP_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return path.startsWith(pattern) || path.includes(`/${pattern}`);
    }
    if (pattern.startsWith('*')) {
      return path.endsWith(pattern.slice(1));
    }
    return path === pattern || path.endsWith(`/${pattern}`);
  });
}

class DevStudioFS {
  private originalFiles: Map<string, string> = new Map();
  private currentFiles: Map<string, string> = new Map();
  private deletedFiles: Set<string> = new Set();
  private fileShas: Map<string, string> = new Map();
  private repoInfo: { owner: string; repo: string; branch: string } | null = null;

  /**
   * Load a GitHub repo into the WebContainer runtime
   */
  async loadRepoToRuntime(
    repo: string,
    branch: string,
    githubToken?: string
  ): Promise<void> {
    const runtime = getRuntime();
    
    if (!runtime.isReady()) {
      await runtime.boot();
    }

    const [owner, repoName] = repo.split('/');
    this.repoInfo = { owner, repo: repoName, branch };

    // Clear previous state
    this.originalFiles.clear();
    this.currentFiles.clear();
    this.deletedFiles.clear();
    this.fileShas.clear();

    // Fetch file tree from GitHub
    const treeUrl = `/api/github/tree?repo=${repo}&ref=${branch}`;
    const treeRes = await fetch(treeUrl, {
      headers: githubToken ? { 'x-gh-token': githubToken } : {},
    });

    if (!treeRes.ok) {
      throw new Error(`Failed to fetch file tree: ${treeRes.statusText}`);
    }

    const treeData = await treeRes.json();
    const files: { path: string; sha: string; size: number }[] = treeData.files;

    // Filter out files we don't want to load
    const filesToLoad = files.filter(f => !shouldSkipFile(f.path));

    // Fetch file contents in batches
    const batchSize = 10;
    const fileContents: Record<string, string> = {};

    for (let i = 0; i < filesToLoad.length; i += batchSize) {
      const batch = filesToLoad.slice(i, i + batchSize);
      
      const promises = batch.map(async (file) => {
        // Skip large files (> 500KB)
        if (file.size > 500000) {
          return { path: file.path, content: `// File too large to load (${file.size} bytes)` };
        }

        const fileUrl = `/api/github/file?repo=${repo}&path=${encodeURIComponent(file.path)}&ref=${branch}`;
        const res = await fetch(fileUrl, {
          headers: githubToken ? { 'x-gh-token': githubToken } : {},
        });

        if (!res.ok) {
          return { path: file.path, content: `// Failed to load: ${res.statusText}` };
        }

        const data = await res.json();
        this.fileShas.set(file.path, data.sha);
        return { path: file.path, content: data.content };
      });

      const results = await Promise.all(promises);
      for (const { path, content } of results) {
        fileContents[path] = content;
        this.originalFiles.set(path, content);
        this.currentFiles.set(path, content);
      }
    }

    // Mount files into WebContainer
    await runtime.mount(fileContents);
  }

  /**
   * Save a file (updates WebContainer FS and tracks as dirty)
   */
  async saveFile(path: string, content: string): Promise<void> {
    const runtime = getRuntime();
    
    await runtime.writeFile(path, content);
    this.currentFiles.set(path, content);
    this.deletedFiles.delete(path);
  }

  /**
   * Create a new file
   */
  async createFile(path: string, content: string = ''): Promise<void> {
    const runtime = getRuntime();
    
    await runtime.writeFile(path, content);
    this.currentFiles.set(path, content);
    this.deletedFiles.delete(path);
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    const runtime = getRuntime();
    
    try {
      await runtime.deleteFile(path);
    } catch {
      // File might not exist in runtime
    }
    
    this.currentFiles.delete(path);
    
    // Only mark as deleted if it existed in original
    if (this.originalFiles.has(path)) {
      this.deletedFiles.add(path);
    }
  }

  /**
   * Rename/move a file
   */
  async rename(from: string, to: string): Promise<void> {
    const runtime = getRuntime();
    
    const content = this.currentFiles.get(from) || '';
    await runtime.rename(from, to);
    
    this.currentFiles.delete(from);
    this.currentFiles.set(to, content);
    
    if (this.originalFiles.has(from)) {
      this.deletedFiles.add(from);
    }
  }

  /**
   * Read a file from the current state
   */
  async readFile(path: string): Promise<string> {
    // First check our cache
    if (this.currentFiles.has(path)) {
      return this.currentFiles.get(path)!;
    }

    // Try reading from runtime
    const runtime = getRuntime();
    const content = await runtime.readFile(path);
    this.currentFiles.set(path, content);
    return content;
  }

  /**
   * Get list of all dirty (changed) files
   */
  getDirtyFiles(): DirtyFile[] {
    const dirty: DirtyFile[] = [];

    // Check modified and new files
    for (const [path, content] of this.currentFiles) {
      const original = this.originalFiles.get(path);
      
      if (original === undefined) {
        // New file
        dirty.push({
          path,
          content,
          originalContent: '',
          isNew: true,
          isDeleted: false,
        });
      } else if (original !== content) {
        // Modified file
        dirty.push({
          path,
          content,
          originalContent: original,
          isNew: false,
          isDeleted: false,
        });
      }
    }

    // Check deleted files
    for (const path of this.deletedFiles) {
      dirty.push({
        path,
        content: '',
        originalContent: this.originalFiles.get(path) || '',
        isNew: false,
        isDeleted: true,
      });
    }

    return dirty;
  }

  /**
   * Check if there are any unsaved changes
   */
  hasChanges(): boolean {
    return this.getDirtyFiles().length > 0;
  }

  /**
   * Get file SHA for GitHub commit
   */
  getFileSha(path: string): string | undefined {
    return this.fileShas.get(path);
  }

  /**
   * Get repo info
   */
  getRepoInfo() {
    return this.repoInfo;
  }

  /**
   * Get all file paths
   */
  getAllPaths(): string[] {
    return Array.from(this.currentFiles.keys()).sort();
  }

  /**
   * Reset a file to its original content
   */
  async resetFile(path: string): Promise<void> {
    const original = this.originalFiles.get(path);
    if (original !== undefined) {
      await this.saveFile(path, original);
    }
  }

  /**
   * Reset all changes
   */
  async resetAll(): Promise<void> {
    const runtime = getRuntime();
    
    // Restore original files
    const fileContents: Record<string, string> = {};
    for (const [path, content] of this.originalFiles) {
      fileContents[path] = content;
    }
    
    await runtime.mount(fileContents);
    
    this.currentFiles = new Map(this.originalFiles);
    this.deletedFiles.clear();
  }

  /**
   * Mark files as committed (update original state)
   */
  markAsCommitted(): void {
    this.originalFiles = new Map(this.currentFiles);
    this.deletedFiles.clear();
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.originalFiles.clear();
    this.currentFiles.clear();
    this.deletedFiles.clear();
    this.fileShas.clear();
    this.repoInfo = null;
  }
}

// Singleton instance
let fsInstance: DevStudioFS | null = null;

export function getFS(): DevStudioFS {
  if (!fsInstance) {
    fsInstance = new DevStudioFS();
  }
  return fsInstance;
}

export function resetFS(): void {
  if (fsInstance) {
    fsInstance.clear();
  }
  fsInstance = null;
}

export type { DevStudioFS };
