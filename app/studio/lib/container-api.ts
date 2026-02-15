/**
 * Container API Client
 * 
 * Connects to Fly.io container service for native binary execution.
 * Provides real Linux terminal via WebSocket.
 */

const CONTAINER_API_URL = process.env.NEXT_PUBLIC_CONTAINER_API_URL || 'https://elevate-studio-containers.fly.dev';

interface FileInfo {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

class ContainerAPI {
  private baseUrl: string;

  constructor(baseUrl: string = CONTAINER_API_URL) {
    this.baseUrl = baseUrl;
  }

  // File operations
  async listFiles(): Promise<FileInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/files`);
    return response.json();
  }

  async readFile(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/file?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    return data.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
  }

  async deleteFile(path: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/file?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  }

  // Command execution (non-interactive)
  async exec(command: string, cwd?: string): Promise<ExecResult> {
    const response = await fetch(`${this.baseUrl}/api/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd }),
    });
    return response.json();
  }

  // Interactive terminal via WebSocket
  connectTerminal(callbacks: {
    onOutput: (data: string) => void;
    onExit: (exitCode: number) => void;
    onReady: (terminalId: string) => void;
    onError: (error: string) => void;
  }): {
    write: (data: string) => void;
    resize: (cols: number, rows: number) => void;
    signal: (sig: 'SIGINT' | 'SIGTSTP') => void;
    close: () => void;
  } {
    const wsUrl = this.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/terminal`);

    ws.onopen = () => {
      // Terminal connected
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'ready':
            callbacks.onReady(msg.terminalId);
            break;
          case 'output':
            callbacks.onOutput(msg.data);
            break;
          case 'exit':
            callbacks.onExit(msg.exitCode);
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
      callbacks.onOutput('\r\n[Container disconnected]\r\n');
    };

    return {
      write: (data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      },
      resize: (cols: number, rows: number) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      },
      signal: (sig: 'SIGINT' | 'SIGTSTP') => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'signal', signal: sig }));
        }
      },
      close: () => {
        ws.close();
      },
    };
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const containerAPI = new ContainerAPI();
export type { FileInfo, ExecResult };
