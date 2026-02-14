'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketTerminalProps {
  wsUrl?: string;
  cwd?: string;
  onPortDetected?: (port: number) => void;
}

export function WebSocketTerminal({ wsUrl = 'http://localhost:3001', cwd, onPortDetected }: WebSocketTerminalProps) {
  const [connected, setConnected] = useState(false);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const socketRef = useRef<Socket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Connect to WebSocket server
  useEffect(() => {
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Create terminal on connect
      socket.emit('terminal:create', { cwd: cwd || process.cwd() });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setTerminalId(null);
    });

    socket.on('terminal:created', ({ id, pid }) => {
      setTerminalId(id);
      setOutput(prev => [...prev, `\x1b[32mTerminal started (PID: ${pid})\x1b[0m\n`]);
    });

    socket.on('terminal:output', ({ data }) => {
      setOutput(prev => [...prev, data]);
      
      // Detect port numbers in output (e.g., "listening on port 3000")
      const portMatch = data.match(/(?:port|listening on|started on)[:\s]*(\d{4,5})/i);
      if (portMatch && onPortDetected) {
        onPortDetected(parseInt(portMatch[1]));
      }
    });

    socket.on('terminal:exit', ({ exitCode }) => {
      setOutput(prev => [...prev, `\n\x1b[33mProcess exited with code ${exitCode}\x1b[0m\n`]);
      setTerminalId(null);
    });

    socket.on('terminal:error', ({ error }) => {
      setOutput(prev => [...prev, `\x1b[31mError: ${error}\x1b[0m\n`]);
    });

    return () => {
      if (terminalId) {
        socket.emit('terminal:kill', { id: terminalId });
      }
      socket.disconnect();
    };
  }, [wsUrl, cwd, onPortDetected]);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const sendInput = useCallback((data: string) => {
    if (socketRef.current && terminalId) {
      socketRef.current.emit('terminal:input', { id: terminalId, data });
    }
  }, [terminalId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        setHistory(prev => [...prev, input]);
        setHistoryIndex(-1);
      }
      sendInput(input + '\n');
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      sendInput('\x03'); // Send Ctrl+C
    } else if (e.key === 'd' && e.ctrlKey) {
      e.preventDefault();
      sendInput('\x04'); // Send Ctrl+D
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setOutput([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  /* eslint-disable no-control-regex */
  const parseAnsi = (text: string) => {
    return text
      .replace(/\x1b\[32m/g, '<span style="color:#7ee787">')
      .replace(/\x1b\[33m/g, '<span style="color:#e2c08d">')
      .replace(/\x1b\[31m/g, '<span style="color:#f85149">')
      .replace(/\x1b\[34m/g, '<span style="color:#58a6ff">')
      .replace(/\x1b\[0m/g, '</span>')
      .replace(/\x1b\[\d+m/g, '');
  };
  /* eslint-enable no-control-regex */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d1117',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        fontSize: 13,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#8b949e',
        fontSize: 12,
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#7ee787' : '#f85149',
        }} />
        <span>Terminal {connected ? '(connected)' : '(disconnected)'}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setOutput([])}
          style={{
            background: 'none',
            border: 'none',
            color: '#8b949e',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            if (socketRef.current) {
              socketRef.current.emit('terminal:create', { cwd });
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#8b949e',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          New
        </button>
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          color: '#e6edf3',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
        dangerouslySetInnerHTML={{ __html: parseAnsi(output.join('')) }}
      />

      {/* Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderTop: '1px solid #30363d',
        gap: 8,
      }}>
        <span style={{ color: '#7ee787' }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!connected || !terminalId}
          placeholder={connected ? '' : 'Connecting...'}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#e6edf3',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}
