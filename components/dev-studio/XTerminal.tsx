'use client';

/**
 * XTerminal — real xterm.js terminal connected to the studio-shell runtime/container.
 *
 * Connection flow:
 *   1. POST /api/devstudio/shell-token  → short-lived HMAC token (60s TTL)
 *   2. WebSocket upgrade to /api/devstudio/shell-ws and send token as the first frame
 *      (custom Next.js server apps/admin/server.js proxies to the shell runtime)
 *   3. Bidirectional PTY frames:
 *        browser → shell: { type: 'input', data: string }
 *                         { type: 'resize', cols: number, rows: number }
 *                         { type: 'ping' }
 *        shell → browser: { type: 'output', data: string }
 *                         { type: 'exit', code: number }
 *                         { type: 'pong' }
 *                         { type: 'error', message: string }
 *
 * Falls back to a "not configured" message when STUDIO_SHELL_WS_URL is unset.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// xterm must be client-side only
const TerminalRenderer = dynamic(() => import('./XTerminalRenderer'), { ssr: false });

export interface XTerminalProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  /** Called with each chunk of text output from the shell — use to detect URLs */
  onOutput?: (text: string) => void;
  /**
   * Called once on mount with a `send` function the parent can store.
   * Calling send(cmd) types the command into the shell followed by Enter.
   * The function becomes a no-op when the WebSocket is not open.
   */
  onReady?: (send: (cmd: string) => void) => void;
}

type Status = 'connecting' | 'connected' | 'disconnected' | 'error' | 'unconfigured';

export default function XTerminal({ onConnect, onDisconnect, onOutput, onReady }: XTerminalProps) {
  const [status, setStatus] = useState<Status>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeReasonRef = useRef<'idle' | 'auth' | 'proxy' | 'shell' | 'manual'>('idle');
  const onReadyFiredRef = useRef(false);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setErrorMsg('');
    closeReasonRef.current = 'idle';
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    if (wsRef.current) {
      closeReasonRef.current = 'manual';
      wsRef.current.close(1000, 'Reconnect requested');
      wsRef.current = null;
    }
    closeReasonRef.current = 'idle';

    // Step 1 — get short-lived token
    let token: string;
    try {
      const res = await fetch('/api/devstudio/shell-token', { method: 'POST' });
      if (res.status === 503) {
        setStatus('unconfigured');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(`Auth failed (${res.status})`);
        return;
      }
      const data = await res.json();
      token = data.token;
    } catch (e) {
      setStatus('error');
      setErrorMsg('Could not reach auth endpoint');
      return;
    }

    // Step 2 — open WebSocket
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/devstudio/shell-ws`;
    const ws = new WebSocket(wsUrl, ['studio-shell']);
    ws.binaryType = 'arraybuffer';

    // Browser WebSocket cannot send custom headers, so the proxy validates the
    // token from the first frame and only sends `ready` after the shell runtime opens.
    wsRef.current = ws;

    ws.onopen = () => {
      // Send token as first frame — server.js validates before forwarding
      ws.send(JSON.stringify({ type: 'auth', token }));

      // Keepalive ping every 30s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30_000);
    };

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const msg = JSON.parse(event.data) as { type?: string; message?: string };
        if (msg.type === 'ready') {
          setStatus('connected');
          onConnect?.();

          // Expose send function to parent — fired once per component lifetime
          if (onReady && !onReadyFiredRef.current) {
            onReadyFiredRef.current = true;
            onReady((cmd: string) => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'input', data: cmd + '\r' }));
              }
            });
          }
        }

        if (msg.type === 'error') {
          closeReasonRef.current = 'shell';
          setStatus('error');
          setErrorMsg(msg.message || 'Shell connection failed');
        }
      } catch {
        // TerminalRenderer handles raw terminal output and malformed frames.
      }
    });

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }

      if (event.code === 4003) {
        closeReasonRef.current = 'auth';
        setStatus('error');
        setErrorMsg('Shell auth token was rejected. Refresh the page and try again.');
        return;
      }

      if (event.code === 1011) {
        closeReasonRef.current = 'proxy';
        setStatus('error');
        setErrorMsg(event.reason || 'Shell proxy could not reach the studio container.');
        return;
      }

      if (['auth', 'manual', 'proxy', 'shell'].includes(closeReasonRef.current)) return;

      setStatus('disconnected');
      onDisconnect?.();
    };

    ws.onerror = () => {
      closeReasonRef.current = 'proxy';
      setStatus('error');
      setErrorMsg('WebSocket connection failed');
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
    };
  }, [onConnect, onDisconnect, onReady]);

  useEffect(() => {
    connect();
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      closeReasonRef.current = 'manual';
      wsRef.current?.close(1001, 'Component unmounted');
    };
  }, [connect]);

  if (status === 'unconfigured') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-slate-400 gap-3 p-8">
        <p className="text-sm font-mono">Studio shell not configured.</p>
        <p className="text-xs text-slate-500 text-center max-w-sm">
          Set <code className="text-slate-300">STUDIO_SHELL_WS_URL</code> and{' '}
          <code className="text-slate-300">STUDIO_SHELL_SECRET</code> in Northflank runtime env, then
          deploy the studio shell service.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-red-400 gap-3 p-8">
        <p className="text-sm font-mono">{errorMsg || 'Connection error'}</p>
        <button
          onClick={connect}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-slate-400 gap-3 p-8">
        <p className="text-sm font-mono">Shell disconnected.</p>
        <button
          onClick={connect}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <TerminalRenderer
        key={status}
        ws={wsRef.current}
        connecting={status === 'connecting'}
        onOutput={onOutput}
      />
    </div>
  );
}
