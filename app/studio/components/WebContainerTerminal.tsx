'use client';

import { useState, useRef, useEffect } from 'react';
import type { TerminalLine, ServerInfo } from '../hooks/useWebContainer';

interface WebContainerTerminalProps {
  terminals: { id: string; lines: TerminalLine[] }[];
  activeTerminal: string;
  servers: ServerInfo[];
  booted: boolean;
  booting: boolean;
  installing: boolean;
  onCommand: (command: string, terminalId?: string) => Promise<number>;
  onBoot: () => Promise<void>;
  onInstall: () => Promise<number>;
  onStartServer: (command?: string) => Promise<boolean>;
  onStopServer: (port: number) => void;
  onClear: (terminalId: string) => void;
  onAddTerminal: () => string;
  onRemoveTerminal: (id: string) => void;
  onSetActiveTerminal: (id: string) => void;
}

// ANSI color codes to CSS
const ANSI_COLORS: Record<string, string> = {
  '30': '#1e1e1e', // black
  '31': '#f85149', // red
  '32': '#3fb950', // green
  '33': '#d29922', // yellow
  '34': '#58a6ff', // blue
  '35': '#bc8cff', // magenta
  '36': '#39c5cf', // cyan
  '37': '#e6edf3', // white
  '90': '#6e7681', // bright black (gray)
  '91': '#ff7b72', // bright red
  '92': '#7ee787', // bright green
  '93': '#e3b341', // bright yellow
  '94': '#79c0ff', // bright blue
  '95': '#d2a8ff', // bright magenta
  '96': '#56d4dd', // bright cyan
  '97': '#ffffff', // bright white
};

function parseAnsi(text: string): { text: string; color: string }[] {
  const parts: { text: string; color: string }[] = [];
  // eslint-disable-next-line no-control-regex
  const regex = /\x1b\[(\d+)m/g;
  let lastIndex = 0;
  let currentColor = '#e6edf3';
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), color: currentColor });
    }
    const code = match[1];
    if (code === '0') {
      currentColor = '#e6edf3';
    } else if (ANSI_COLORS[code]) {
      currentColor = ANSI_COLORS[code];
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), color: currentColor });
  }

  return parts.length > 0 ? parts : [{ text, color: '#e6edf3' }];
}

export function WebContainerTerminal({
  terminals,
  activeTerminal,
  servers,
  booted,
  booting,
  installing,
  onCommand,
  onBoot,
  onInstall,
  onStartServer,
  onStopServer,
  onClear,
  onAddTerminal,
  onRemoveTerminal,
  onSetActiveTerminal,
}: WebContainerTerminalProps) {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const currentTerminal = terminals.find(t => t.id === activeTerminal);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [currentTerminal?.lines]);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setRunning(true);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd.trim() === 'clear') {
      onClear(activeTerminal);
      setInput('');
      setRunning(false);
      return;
    }

    await onCommand(cmd, activeTerminal);
    setInput('');
    setRunning(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !running) {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      setInput('');
      setRunning(false);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onClear(activeTerminal);
    }
  };

  const getLineStyle = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return { color: '#7ee787', fontWeight: 600 };
      case 'output': return { color: '#e6edf3' };
      case 'error': return { color: '#f85149' };
      case 'system': return { color: '#58a6ff', fontStyle: 'italic' as const };
      default: return { color: '#e6edf3' };
    }
  };

  const getLineIcon = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return '❯';
      case 'system': return '→';
      case 'error': return '✗';
      default: return ' ';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #0d1117 0%, #010409 100%)',
        fontFamily: '"Fira Code", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header with tabs and actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #30363d',
        background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
      }}>
        {/* Terminal tabs */}
        <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          {terminals.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => onSetActiveTerminal(t.id)}
              style={{
                padding: '8px 16px',
                background: t.id === activeTerminal 
                  ? 'linear-gradient(180deg, #21262d 0%, #0d1117 100%)' 
                  : 'transparent',
                borderBottom: t.id === activeTerminal ? '2px solid #58a6ff' : '2px solid transparent',
                color: t.id === activeTerminal ? '#e6edf3' : '#8b949e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: t.id === activeTerminal ? 500 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ 
                color: t.id === activeTerminal ? '#3fb950' : '#6e7681',
                fontSize: 10,
              }}>
                ●
              </span>
              <span>{t.id === 'main' ? 'bash' : `bash-${idx}`}</span>
              {t.id !== 'main' && (
                <span
                  onClick={(e) => { e.stopPropagation(); onRemoveTerminal(t.id); }}
                  style={{ 
                    color: '#8b949e', 
                    cursor: 'pointer',
                    padding: '0 4px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#f85149'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#8b949e'}
                >
                  ×
                </span>
              )}
            </div>
          ))}
          <button
            onClick={onAddTerminal}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#3fb950'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#8b949e'}
          >
            +
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, padding: '6px 12px' }}>
          {!booted && (
            <button
              onClick={onBoot}
              disabled={booting}
              style={{
                padding: '6px 14px',
                background: booting 
                  ? '#21262d' 
                  : 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: booting ? 'not-allowed' : 'pointer',
                fontSize: 11,
                fontWeight: 600,
                boxShadow: booting ? 'none' : '0 2px 8px rgba(35, 134, 54, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {booting ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                  Booting...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Boot
                </>
              )}
            </button>
          )}
          {booted && (
            <>
              <button
                onClick={onInstall}
                disabled={installing}
                style={{
                  padding: '6px 12px',
                  background: installing 
                    ? '#21262d' 
                    : 'linear-gradient(135deg, #d29922 0%, #e3b341 100%)',
                  border: 'none',
                  borderRadius: 6,
                  color: installing ? '#8b949e' : '#000',
                  cursor: installing ? 'not-allowed' : 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {installing ? '⟳ Installing...' : '📦 Install'}
              </button>
              <button
                onClick={() => onStartServer()}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(31, 111, 235, 0.3)',
                }}
              >
                ▶ Run Dev
              </button>
            </>
          )}
          <button
            onClick={() => onClear(activeTerminal)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 6,
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Server URLs */}
      {servers.length > 0 && (
        <div style={{
          padding: '8px 16px',
          background: 'linear-gradient(90deg, rgba(35, 134, 54, 0.1) 0%, rgba(31, 111, 235, 0.1) 100%)',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {servers.map(server => (
            <div key={server.port} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              padding: '4px 12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 20,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: server.status === 'running' 
                  ? '#3fb950' 
                  : server.status === 'starting' 
                  ? '#d29922' 
                  : '#f85149',
                boxShadow: server.status === 'running' 
                  ? '0 0 8px #3fb950' 
                  : 'none',
              }} />
              <span style={{ color: '#8b949e', fontSize: 11 }}>:{server.port}</span>
              <a
                href={server.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#58a6ff', 
                  fontSize: 12,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {server.url.replace('https://', '')}
              </a>
              {server.status === 'running' && (
                <button
                  onClick={() => onStopServer(server.port)}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(248, 81, 73, 0.2)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#f85149',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  Stop
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Output */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          color: '#e6edf3',
        }}
      >
        {/* Welcome message if empty */}
        {(!currentTerminal?.lines || currentTerminal.lines.length === 0) && (
          <div style={{ color: '#6e7681', marginBottom: 16 }}>
            <div style={{ color: '#58a6ff', fontWeight: 600, marginBottom: 8 }}>
              Welcome to Elevate Studio Terminal
            </div>
            <div style={{ fontSize: 12 }}>
              {!booted ? (
                <>Click <span style={{ color: '#3fb950' }}>Boot</span> to start the WebContainer environment</>
              ) : (
                <>Type a command and press Enter to run</>
              )}
            </div>
          </div>
        )}

        {currentTerminal?.lines.map(line => (
          <div
            key={line.id}
            style={{
              ...getLineStyle(line.type),
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              marginBottom: 2,
              display: 'flex',
              gap: 8,
            }}
          >
            <span style={{ 
              color: line.type === 'input' ? '#3fb950' 
                : line.type === 'error' ? '#f85149' 
                : line.type === 'system' ? '#58a6ff' 
                : '#6e7681',
              width: 12,
              flexShrink: 0,
            }}>
              {getLineIcon(line.type)}
            </span>
            <span>
              {parseAnsi(line.content).map((part, i) => (
                <span key={i} style={{ color: part.color }}>{part.text}</span>
              ))}
            </span>
          </div>
        ))}

        {/* Input line */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginTop: 8,
          padding: '8px 0',
        }}>
          <span style={{ 
            color: running ? '#d29922' : '#3fb950',
            fontWeight: 600,
          }}>
            {running ? '⟳' : '❯'}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running || !booted}
            placeholder={!booted ? 'Boot WebContainer first...' : running ? 'Running...' : ''}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#7ee787',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              outline: 'none',
              caretColor: '#3fb950',
            }}
          />
          {running && (
            <span style={{ 
              color: '#d29922', 
              fontSize: 11,
              animation: 'pulse 1s ease-in-out infinite',
            }}>
              Running...
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
