/**
 * Workspace Durable Object
 *
 * Manages workspace state, file watchers, and collaborative editing
 */

interface WorkspaceState {
  id: string;
  userId: string;
  name: string;
  activeConnections: Map<string, WebSocket>;
  fileWatchers: Map<string, Set<string>>; // path -> connection IDs
}

export class WorkspaceDurableObject {
  private state: DurableObjectState;
  private env: any;
  private workspaceState: WorkspaceState | null = null;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize workspace
    if (path === '/init' && request.method === 'POST') {
      const body = (await request.json()) as { id: string; userId: string; name: string };
      this.workspaceState = {
        id: body.id,
        userId: body.userId,
        name: body.name,
        activeConnections: new Map(),
        fileWatchers: new Map(),
      };
      await this.state.storage.put('workspace', this.workspaceState);
      return new Response(JSON.stringify({ success: true }));
    }

    // WebSocket connection for real-time collaboration
    if (path === '/connect') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Broadcast file change to all connected clients
    if (path === '/broadcast' && request.method === 'POST') {
      const body = (await request.json()) as { type: string; path: string; content?: string };
      this.broadcast(body);
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(ws: WebSocket) {
    ws.accept();

    const connectionId = crypto.randomUUID();

    if (!this.workspaceState) {
      this.workspaceState = ((await this.state.storage.get('workspace')) as WorkspaceState) || {
        id: '',
        userId: '',
        name: '',
        activeConnections: new Map(),
        fileWatchers: new Map(),
      };
    }

    this.workspaceState.activeConnections.set(connectionId, ws);

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        await this.handleMessage(connectionId, message, ws);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.addEventListener('close', () => {
      this.workspaceState?.activeConnections.delete(connectionId);
      // Remove from all file watchers
      this.workspaceState?.fileWatchers.forEach((watchers) => {
        watchers.delete(connectionId);
      });
    });

    // Send initial state
    ws.send(
      JSON.stringify({
        type: 'connected',
        connectionId,
        activeUsers: this.workspaceState.activeConnections.size,
      }),
    );
  }

  private async handleMessage(connectionId: string, message: any, ws: WebSocket) {
    switch (message.type) {
      case 'watch':
        // Subscribe to file changes
        if (!this.workspaceState!.fileWatchers.has(message.path)) {
          this.workspaceState!.fileWatchers.set(message.path, new Set());
        }
        this.workspaceState!.fileWatchers.get(message.path)!.add(connectionId);
        ws.send(JSON.stringify({ type: 'watching', path: message.path }));
        break;

      case 'unwatch':
        this.workspaceState!.fileWatchers.get(message.path)?.delete(connectionId);
        break;

      case 'cursor':
        // Broadcast cursor position to other users
        this.broadcast(
          {
            type: 'cursor',
            userId: message.userId,
            path: message.path,
            position: message.position,
          },
          connectionId,
        );
        break;

      case 'selection':
        // Broadcast selection to other users
        this.broadcast(
          {
            type: 'selection',
            userId: message.userId,
            path: message.path,
            selection: message.selection,
          },
          connectionId,
        );
        break;

      case 'edit':
        // Broadcast edit operation (for OT/CRDT)
        this.broadcast(
          {
            type: 'edit',
            userId: message.userId,
            path: message.path,
            operation: message.operation,
          },
          connectionId,
        );
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private broadcast(message: any, excludeConnectionId?: string) {
    const data = JSON.stringify(message);
    this.workspaceState?.activeConnections.forEach((ws, id) => {
      if (id !== excludeConnectionId) {
        try {
          ws.send(data);
        } catch {
          // Connection closed, will be cleaned up
        }
      }
    });
  }
}
