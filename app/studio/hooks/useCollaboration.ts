'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { studioAPI } from '../lib/studio-api';

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface UserCursor {
  id: string;
  userId: string;
  userName: string;
  color: string;
  position: CursorPosition;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface CollaborationState {
  connected: boolean;
  connectionId: string | null;
  activeUsers: number;
  cursors: Map<string, UserCursor>;
}

const CURSOR_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
  '#00b894', '#e17055', '#0984e3', '#6c5ce7'
];

/**
 * Hook for real-time collaborative editing
 * Uses WebSocket connection to Cloudflare Durable Objects
 */
export function useCollaboration(workspaceId: string | null, userId: string, userName: string) {
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    connectionId: null,
    activeUsers: 0,
    cursors: new Map(),
  });

  const connectionRef = useRef<ReturnType<typeof studioAPI.connectWorkspace> | null>(null);
  const colorRef = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // Connect to workspace
  const connect = useCallback(() => {
    if (!workspaceId || connectionRef.current) return;

    connectionRef.current = studioAPI.connectWorkspace(workspaceId, {
      onConnected: (connectionId, activeUsers) => {
        setState(s => ({
          ...s,
          connected: true,
          connectionId,
          activeUsers,
        }));
      },
      onCursor: (userId, path, position) => {
        setState(s => {
          const cursors = new Map(s.cursors);
          const existing = cursors.get(userId);
          cursors.set(userId, {
            id: userId,
            userId,
            userName: existing?.userName || `User ${userId.slice(0, 4)}`,
            color: existing?.color || CURSOR_COLORS[cursors.size % CURSOR_COLORS.length],
            position,
          });
          return { ...s, cursors };
        });
      },
      onEdit: (userId, path, operation) => {
        // Handle incoming edit operations
        // This would integrate with Monaco's edit API
        // TODO: integrate with Monaco's edit API
      },
      onUserJoined: (userId) => {
        setState(s => ({ ...s, activeUsers: s.activeUsers + 1 }));
      },
      onUserLeft: (userId) => {
        setState(s => {
          const cursors = new Map(s.cursors);
          cursors.delete(userId);
          return { ...s, activeUsers: Math.max(0, s.activeUsers - 1), cursors };
        });
      },
    });
  }, [workspaceId]);

  // Disconnect
  const disconnect = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    setState({
      connected: false,
      connectionId: null,
      activeUsers: 0,
      cursors: new Map(),
    });
  }, []);

  // Watch a file for changes
  const watchFile = useCallback((path: string) => {
    connectionRef.current?.watchFile(path);
  }, []);

  // Unwatch a file
  const unwatchFile = useCallback((path: string) => {
    connectionRef.current?.unwatchFile(path);
  }, []);

  // Send cursor position
  const sendCursor = useCallback((path: string, position: CursorPosition) => {
    connectionRef.current?.sendCursor(path, position);
  }, []);

  // Send selection
  const sendSelection = useCallback((path: string, selection: UserCursor['selection']) => {
    connectionRef.current?.sendCursor(path, { selection });
  }, []);

  // Send edit operation
  const sendEdit = useCallback((path: string, operation: any) => {
    connectionRef.current?.sendEdit(path, operation);
  }, []);

  // Auto-connect when workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [workspaceId, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    watchFile,
    unwatchFile,
    sendCursor,
    sendSelection,
    sendEdit,
    myColor: colorRef.current,
  };
}

/**
 * Monaco editor decorations for remote cursors
 */
export function createCursorDecorations(monaco: any, cursors: Map<string, UserCursor>, currentPath: string) {
  const decorations: any[] = [];

  cursors.forEach((cursor) => {
    // Cursor line decoration
    decorations.push({
      range: new monaco.Range(
        cursor.position.lineNumber,
        cursor.position.column,
        cursor.position.lineNumber,
        cursor.position.column + 1
      ),
      options: {
        className: `remote-cursor-${cursor.id}`,
        beforeContentClassName: `remote-cursor-marker`,
        hoverMessage: { value: cursor.userName },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    });

    // Selection decoration
    if (cursor.selection) {
      decorations.push({
        range: new monaco.Range(
          cursor.selection.startLineNumber,
          cursor.selection.startColumn,
          cursor.selection.endLineNumber,
          cursor.selection.endColumn
        ),
        options: {
          className: `remote-selection-${cursor.id}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }
  });

  return decorations;
}

/**
 * Generate CSS for cursor colors
 */
export function generateCursorStyles(cursors: Map<string, UserCursor>): string {
  let css = '';
  
  cursors.forEach((cursor) => {
    css += `
      .remote-cursor-${cursor.id} {
        background-color: ${cursor.color};
        width: 2px !important;
      }
      .remote-selection-${cursor.id} {
        background-color: ${cursor.color}33;
      }
    `;
  });

  return css;
}
