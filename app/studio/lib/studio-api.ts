import { logger } from '@/lib/logger';
/**
 * Studio API Client
 * 
 * Connects to Cloudflare Workers backend for:
 * - Persistent file storage (R2)
 * - Terminal sessions (Durable Objects)
 * - Git operations
 */

const API_BASE = process.env.NEXT_PUBLIC_STUDIO_API_URL || 'https://studio-api.elevateforhumanity.org';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  repoUrl?: string;
  repoBranch?: string;
  createdAt: string;
  updatedAt: string;
}

interface FileInfo {
  path: string;
  size: number;
  modified: string;
}

interface FileListResult {
  files: FileInfo[];
  directories: string[];
}

class StudioAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok && response.status === 401) {
      throw new Error('Unauthorized - please sign in');
    }

    return response;
  }

  // Workspace operations
  async listWorkspaces(): Promise<Workspace[]> {
    const response = await this.fetch('/api/workspace');
    const data = await response.json();
    return data;
  }

  async createWorkspace(name: string, description?: string, repoUrl?: string): Promise<Workspace> {
    const response = await this.fetch('/api/workspace', {
      method: 'POST',
      body: JSON.stringify({ name, description, repoUrl }),
    });
    return response.json();
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await this.fetch(`/api/workspace/${id}`);
    return response.json();
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.fetch(`/api/workspace/${id}`, { method: 'DELETE' });
  }

  // File operations
  async listFiles(workspaceId: string, path: string = ''): Promise<FileListResult> {
    const params = new URLSearchParams({ workspace: workspaceId, path, list: 'true' });
    const response = await this.fetch(`/api/files?${params}`);
    return response.json();
  }

  async readFile(workspaceId: string, path: string): Promise<string> {
    const params = new URLSearchParams({ workspace: workspaceId, path });
    const response = await this.fetch(`/api/files?${params}`);
    const data = await response.json();
    return data.content;
  }

  async writeFile(workspaceId: string, path: string, content: string): Promise<void> {
    const params = new URLSearchParams({ workspace: workspaceId, path });
    const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    
    // Use chunked upload for large files
    if (content.length > MAX_CHUNK_SIZE) {
      const totalChunks = Math.ceil(content.length / MAX_CHUNK_SIZE);
      let uploadId: string | undefined;
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = content.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
        const response = await this.fetch(`/api/files?${params}`, {
          method: 'PUT',
          body: JSON.stringify({ 
            chunk, 
            chunkIndex: i, 
            totalChunks,
            uploadId 
          }),
        });
        const result = await response.json();
        uploadId = result.uploadId;
      }
      return;
    }
    
    // Regular upload for small files
    await this.fetch(`/api/files?${params}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteFile(workspaceId: string, path: string): Promise<void> {
    const params = new URLSearchParams({ workspace: workspaceId, path });
    await this.fetch(`/api/files?${params}`, { method: 'DELETE' });
  }

  // Git operations
  async cloneRepo(workspaceId: string, repoUrl: string, branch?: string): Promise<{ filesCloned: number }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const response = await this.fetch(`/api/git/clone?${params}`, {
      method: 'POST',
      body: JSON.stringify({ repoUrl, branch }),
    });
    return response.json();
  }

  async pushToGitHub(
    workspaceId: string,
    repoUrl: string,
    files: { path: string; content: string }[],
    message: string,
    githubToken: string,
    branch?: string
  ): Promise<{ success: boolean; commit?: string; message?: string }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const response = await this.fetch(`/api/git/push?${params}`, {
      method: 'POST',
      headers: {
        'x-github-token': githubToken,
      },
      body: JSON.stringify({ repoUrl, files, message, branch }),
    });
    return response.json();
  }

  async pullFromGitHub(
    workspaceId: string,
    repoUrl: string,
    githubToken?: string,
    branch?: string
  ): Promise<{ success: boolean; filesUpdated: number }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const headers: Record<string, string> = {};
    if (githubToken) {
      headers['x-github-token'] = githubToken;
    }
    const response = await this.fetch(`/api/git/pull?${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ repoUrl, branch }),
    });
    return response.json();
  }

  // Node modules cache operations
  async checkNodeModulesCache(workspaceId: string, packageLockHash: string): Promise<{ exists: boolean; size?: number }> {
    const params = new URLSearchParams({ workspace: workspaceId, hash: packageLockHash });
    const response = await this.fetch(`/api/cache/node_modules?${params}`);
    return response.json();
  }

  async saveNodeModulesCache(workspaceId: string, packageLockHash: string, tarball: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const response = await this.fetch(`/api/cache/node_modules?${params}`, {
      method: 'POST',
      body: JSON.stringify({ packageLockHash, tarball }),
    });
    return response.json();
  }

  async downloadNodeModulesCache(workspaceId: string, packageLockHash: string): Promise<{ tarball: string } | null> {
    const params = new URLSearchParams({ workspace: workspaceId, hash: packageLockHash });
    const response = await this.fetch(`/api/cache/node_modules/download?${params}`);
    if (!response.ok) return null;
    return response.json();
  }

  async clearNodeModulesCache(workspaceId: string): Promise<{ deleted: number }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const response = await this.fetch(`/api/cache/node_modules?${params}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Terminal operations
  async executeCommand(workspaceId: string, command: string): Promise<{ output: string; exitCode: number }> {
    const params = new URLSearchParams({ workspace: workspaceId });
    const response = await this.fetch(`/api/terminal/exec?${params}`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
    return response.json();
  }

  // WebSocket terminal connection
  connectTerminal(workspaceId: string, callbacks: {
    onOutput: (content: string) => void;
    onComplete: (exitCode: number) => void;
    onError: (error: string) => void;
    onReady: (cwd: string) => void;
  }): {
    send: (command: string) => void;
    resize: (cols: number, rows: number) => void;
    signal: (sig: string) => void;
    close: () => void;
  } {
    const wsUrl = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');
    const params = new URLSearchParams({ workspace: workspaceId });
    const ws = new WebSocket(`${wsUrl}/api/terminal/connect?${params}`);

    ws.onopen = () => {
      // Send auth token
      if (this.token) {
        ws.send(JSON.stringify({ type: 'auth', token: this.token }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'ready':
            callbacks.onReady(message.cwd);
            break;
          case 'output':
          case 'input':
            callbacks.onOutput(message.content);
            break;
          case 'complete':
            callbacks.onComplete(message.exitCode);
            break;
          case 'error':
            callbacks.onError(message.message);
            break;
        }
      } catch (e) {
        callbacks.onError('Failed to parse message');
      }
    };

    ws.onerror = () => {
      callbacks.onError('WebSocket connection error');
    };

    ws.onclose = () => {
      callbacks.onOutput('\r\n[Connection closed]\r\n');
    };

    return {
      send: (command: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'command', command }));
        }
      },
      resize: (cols: number, rows: number) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      },
      signal: (sig: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'signal', signal: sig }));
        }
      },
      close: () => {
        ws.close();
      },
    };
  }

  // Workspace collaboration WebSocket
  connectWorkspace(workspaceId: string, callbacks: {
    onConnected: (connectionId: string, activeUsers: number) => void;
    onCursor: (userId: string, path: string, position: any) => void;
    onEdit: (userId: string, path: string, operation: any) => void;
    onUserJoined: (userId: string) => void;
    onUserLeft: (userId: string) => void;
  }): {
    watchFile: (path: string) => void;
    unwatchFile: (path: string) => void;
    sendCursor: (path: string, position: any) => void;
    sendEdit: (path: string, operation: any) => void;
    close: () => void;
  } {
    const wsUrl = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');
    const params = new URLSearchParams({ workspace: workspaceId });
    const ws = new WebSocket(`${wsUrl}/api/workspace/connect?${params}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'connected':
            callbacks.onConnected(message.connectionId, message.activeUsers);
            break;
          case 'cursor':
            callbacks.onCursor(message.userId, message.path, message.position);
            break;
          case 'edit':
            callbacks.onEdit(message.userId, message.path, message.operation);
            break;
          case 'user_joined':
            callbacks.onUserJoined(message.userId);
            break;
          case 'user_left':
            callbacks.onUserLeft(message.userId);
            break;
        }
      } catch (e) {
        logger.error('Failed to parse workspace message:', e);
      }
    };

    return {
      watchFile: (path: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'watch', path }));
        }
      },
      unwatchFile: (path: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unwatch', path }));
        }
      },
      sendCursor: (path: string, position: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'cursor', path, position }));
        }
      },
      sendEdit: (path: string, operation: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'edit', path, operation }));
        }
      },
      close: () => {
        ws.close();
      },
    };
  }
}

export const studioAPI = new StudioAPI();
export type { Workspace, FileInfo, FileListResult };
