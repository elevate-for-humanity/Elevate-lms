/**
 * Yjs Collaborative Editing Provider
 * Enables real-time collaboration for documents, notes, and course content
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollaborationConfig {
  documentId: string;
  userId: string;
  userName: string;
  websocketUrl?: string;
}

export class CollaborationProvider {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private awareness: any;

  constructor(config: CollaborationConfig) {
    this.doc = new Y.Doc();

    const wsUrl =
      config.websocketUrl || process.env.NEXT_PUBLIC_COLLABORATION_WS_URL;

    this.provider = new WebsocketProvider(wsUrl, config.documentId, this.doc);

    this.awareness = this.provider.awareness;
    this.awareness.setLocalStateField('user', {
      id: config.userId,
      name: config.userName,
      color: this.generateUserColor(config.userId),
    });
  }

  /**
   * Get the shared document
   */
  getDoc(): Y.Doc {
    return this.doc;
  }

  /**
   * Get a shared text field
   */
  getText(fieldName: string): Y.Text {
    return this.doc.getText(fieldName);
  }

  /**
   * Get a shared map (key-value store)
   */
  getMap(fieldName: string): Y.Map<any> {
    return this.doc.getMap(fieldName);
  }

  /**
   * Get a shared array
   */
  getArray(fieldName: string): Y.Array<any> {
    return this.doc.getArray(fieldName);
  }

  /**
   * Get awareness (who's online, cursor positions, etc.)
   */
  getAwareness() {
    return this.awareness;
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): Array<{ id: string; name: string; color: string }> {
    const states = this.awareness.getStates();
    const users: Array<{ id: string; name: string; color: string }> = [];

    states.forEach((state: any) => {
      if (state.user) {
        users.push(state.user);
      }
    });

    return users;
  }

  /**
   * Update local user state (cursor position, selection, etc.)
   */
  updateLocalState(state: Record<string, any>) {
    Object.entries(state).forEach(([key, value]) => {
      this.awareness.setLocalStateField(key, value);
    });
  }

  /**
   * Subscribe to awareness changes (users joining/leaving, cursor moves)
   */
  onAwarenessChange(callback: (states: Map<number, any>) => void) {
    this.awareness.on('change', () => {
      callback(this.awareness.getStates());
    });
  }

  /**
   * Subscribe to document changes
   */
  onDocumentChange(callback: () => void) {
    this.doc.on('update', callback);
  }

  /**
   * Disconnect and cleanup
   */
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    this.doc.destroy();
  }

  /**
   * Generate a consistent color for a user based on their ID
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
      '#F8B739',
      '#52B788',
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}

/**
 * Create a collaboration provider for a document
 */
export function createCollaborationProvider(config: CollaborationConfig): CollaborationProvider {
  return new CollaborationProvider(config);
}
