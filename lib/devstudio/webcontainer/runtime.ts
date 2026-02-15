import { WebContainer, WebContainerProcess } from '@webcontainer/api';

export interface ProcessHandle {
  process: WebContainerProcess;
  output: WritableStreamDefaultWriter<string>;
  exit: Promise<number>;
  kill: () => void;
}

export interface DevServerHandle {
  url: string;
  process: ProcessHandle;
}

type OutputCallback = (data: string) => void;

class WebContainerRuntime {
  private container: WebContainer | null = null;
  private devServerProcess: ProcessHandle | null = null;
  private outputCallback: OutputCallback | null = null;
  private isBooted = false;

  /**
   * Set callback for terminal output
   */
  onOutput(callback: OutputCallback) {
    this.outputCallback = callback;
  }

  private emit(data: string) {
    if (this.outputCallback) {
      this.outputCallback(data);
    }
  }

  /**
   * Boot the WebContainer instance
   */
  async boot(): Promise<void> {
    if (this.isBooted && this.container) {
      this.emit('WebContainer already booted\n');
      return;
    }

    this.emit('Booting WebContainer...\n');
    
    try {
      this.container = await WebContainer.boot();
      this.isBooted = true;
      this.emit('WebContainer booted successfully\n');

      // Enable corepack for pnpm
      await this.spawn('corepack', ['enable']);
      this.emit('Corepack enabled\n');
    } catch (error) {
      const message = 'Operation failed';
      this.emit(`Failed to boot WebContainer: ${message}\n`);
      throw error;
    }
  }

  /**
   * Mount files into the WebContainer filesystem
   */
  async mount(files: Record<string, string>): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    // Convert flat path->content map to WebContainer file tree structure
    const fileTree = this.buildFileTree(files);
    
    this.emit(`Mounting ${Object.keys(files).length} files...\n`);
    await this.container.mount(fileTree);
    this.emit('Files mounted successfully\n');
  }

  /**
   * Convert flat path->content map to nested WebContainer file tree
   */
  private buildFileTree(files: Record<string, string>): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const [path, content] of Object.entries(files)) {
      const parts = path.split('/').filter(Boolean);
      let current = tree;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }

      const fileName = parts[parts.length - 1];
      current[fileName] = {
        file: { contents: content }
      };
    }

    return tree;
  }

  /**
   * Write a single file to the WebContainer filesystem
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    // Ensure directory exists
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (dir) {
      await this.container.fs.mkdir(dir, { recursive: true });
    }

    await this.container.fs.writeFile(path, content);
  }

  /**
   * Read a file from the WebContainer filesystem
   */
  async readFile(path: string): Promise<string> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    return await this.container.fs.readFile(path, 'utf-8');
  }

  /**
   * Delete a file from the WebContainer filesystem
   */
  async deleteFile(path: string): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    await this.container.fs.rm(path);
  }

  /**
   * Rename/move a file in the WebContainer filesystem
   */
  async rename(from: string, to: string): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    const content = await this.readFile(from);
    await this.writeFile(to, content);
    await this.deleteFile(from);
  }

  /**
   * List files in a directory
   */
  async readdir(path: string): Promise<string[]> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    return await this.container.fs.readdir(path);
  }

  /**
   * Spawn a process in the WebContainer
   */
  async spawn(cmd: string, args: string[] = [], opts?: { cwd?: string }): Promise<ProcessHandle> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    this.emit(`$ ${cmd} ${args.join(' ')}\n`);

    const process = await this.container.spawn(cmd, args, {
      cwd: opts?.cwd,
    });

    // Stream output to callback
    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.emit(data);
        },
      })
    );

    const exit = process.exit;

    return {
      process,
      output: process.input.getWriter(),
      exit,
      kill: () => process.kill(),
    };
  }

  /**
   * Install dependencies using pnpm
   */
  async installDeps(): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    this.emit('\n📦 Installing dependencies...\n');

    const handle = await this.spawn('pnpm', ['install']);
    const exitCode = await handle.exit;

    if (exitCode !== 0) {
      throw new Error(`pnpm install failed with exit code ${exitCode}`);
    }

    this.emit('✅ Dependencies installed\n');
  }

  /**
   * Start the Next.js dev server
   */
  async startDevServer(): Promise<DevServerHandle> {
    if (!this.container) {
      throw new Error('WebContainer not booted');
    }

    // Stop existing dev server if running
    if (this.devServerProcess) {
      await this.stopDevServer();
    }

    this.emit('\n🚀 Starting dev server...\n');

    const process = await this.spawn('pnpm', ['dev', '--', '--hostname', '0.0.0.0', '--port', '3000']);
    this.devServerProcess = process;

    // Wait for server-ready event
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Dev server startup timeout (60s)'));
      }, 60000);

      this.container!.on('server-ready', (port, url) => {
        clearTimeout(timeout);
        this.emit(`\n✅ Dev server ready at ${url}\n`);
        resolve({
          url,
          process,
        });
      });

      // Also check for errors in output
      process.exit.then((code) => {
        if (code !== 0 && !this.devServerProcess) {
          clearTimeout(timeout);
          reject(new Error(`Dev server exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Stop the dev server
   */
  async stopDevServer(): Promise<void> {
    if (this.devServerProcess) {
      this.emit('\n⏹️ Stopping dev server...\n');
      this.devServerProcess.kill();
      this.devServerProcess = null;
      this.emit('Dev server stopped\n');
    }
  }

  /**
   * Check if dev server is running
   */
  isDevServerRunning(): boolean {
    return this.devServerProcess !== null;
  }

  /**
   * Reset the WebContainer (teardown and reboot)
   */
  async reset(): Promise<void> {
    this.emit('\n🔄 Resetting WebContainer...\n');

    if (this.devServerProcess) {
      await this.stopDevServer();
    }

    if (this.container) {
      await this.container.teardown();
      this.container = null;
      this.isBooted = false;
    }

    await this.boot();
    this.emit('WebContainer reset complete\n');
  }

  /**
   * Get the WebContainer instance (for advanced usage)
   */
  getContainer(): WebContainer | null {
    return this.container;
  }

  /**
   * Check if WebContainer is booted
   */
  isReady(): boolean {
    return this.isBooted && this.container !== null;
  }
}

// Singleton instance
let runtimeInstance: WebContainerRuntime | null = null;

export function getRuntime(): WebContainerRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new WebContainerRuntime();
  }
  return runtimeInstance;
}

export function resetRuntime(): void {
  if (runtimeInstance) {
    runtimeInstance.reset();
  }
  runtimeInstance = null;
}

export type { WebContainerRuntime };
