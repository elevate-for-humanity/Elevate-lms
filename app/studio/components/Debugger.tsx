'use client';

import { useState, useCallback } from 'react';

interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

interface Variable {
  name: string;
  value: string;
  type: string;
  expandable?: boolean;
  children?: Variable[];
}

interface StackFrame {
  id: number;
  name: string;
  file: string;
  line: number;
  column: number;
}

interface DebuggerProps {
  activeFile?: string;
  breakpoints: Breakpoint[];
  onAddBreakpoint: (file: string, line: number) => void;
  onRemoveBreakpoint: (id: string) => void;
  onToggleBreakpoint: (id: string) => void;
}

export function Debugger({
  activeFile,
  breakpoints,
  onAddBreakpoint,
  onRemoveBreakpoint,
  onToggleBreakpoint,
}: DebuggerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [callStack, setCallStack] = useState<StackFrame[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);

  // Simulated debug session
  const startDebugging = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    setOutput(['Debug session started...']);
    setVariables([]);
    setCallStack([]);

    // In a real implementation, this would connect to a debug adapter
    // For now, we simulate the debugging experience
    setTimeout(() => {
      if (breakpoints.length > 0) {
        const bp = breakpoints.find(b => b.enabled);
        if (bp) {
          setIsPaused(true);
          setCurrentLine(bp.line);
          setOutput(prev => [...prev, `Paused at breakpoint: ${bp.file}:${bp.line}`]);
          
          // Simulate variables
          setVariables([
            { name: 'this', value: '{...}', type: 'object', expandable: true },
            { name: 'args', value: '[]', type: 'array', expandable: true },
            { name: 'result', value: 'undefined', type: 'undefined' },
          ]);

          // Simulate call stack
          setCallStack([
            { id: 0, name: 'handleClick', file: bp.file, line: bp.line, column: 1 },
            { id: 1, name: 'onClick', file: bp.file, line: bp.line - 5, column: 1 },
            { id: 2, name: '(anonymous)', file: 'react-dom.js', line: 1234, column: 1 },
          ]);
        }
      }
    }, 500);
  }, [breakpoints]);

  const stopDebugging = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentLine(null);
    setOutput(prev => [...prev, 'Debug session ended.']);
  }, []);

  const continueExecution = useCallback(() => {
    setIsPaused(false);
    setCurrentLine(null);
    setOutput(prev => [...prev, 'Continuing...']);
    
    // Simulate hitting next breakpoint or finishing
    setTimeout(() => {
      setOutput(prev => [...prev, 'Program finished.']);
      stopDebugging();
    }, 1000);
  }, [stopDebugging]);

  const stepOver = useCallback(() => {
    if (currentLine) {
      setCurrentLine(currentLine + 1);
      setOutput(prev => [...prev, `Step over to line ${currentLine + 1}`]);
    }
  }, [currentLine]);

  const stepInto = useCallback(() => {
    setOutput(prev => [...prev, 'Step into...']);
    // Would step into function call
  }, []);

  const stepOut = useCallback(() => {
    setOutput(prev => [...prev, 'Step out...']);
    // Would step out of current function
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        borderBottom: '1px solid #3c3c3c',
      }}>
        {!isRunning ? (
          <button
            onClick={startDebugging}
            style={{
              padding: '4px 8px',
              background: '#238636',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ▶ Start
          </button>
        ) : (
          <>
            <button
              onClick={stopDebugging}
              style={{
                padding: '4px 8px',
                background: '#da3633',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ■ Stop
            </button>
            {isPaused && (
              <>
                <button
                  onClick={continueExecution}
                  title="Continue (F5)"
                  style={toolbarBtn}
                >
                  ▶
                </button>
                <button
                  onClick={stepOver}
                  title="Step Over (F10)"
                  style={toolbarBtn}
                >
                  ⤵
                </button>
                <button
                  onClick={stepInto}
                  title="Step Into (F11)"
                  style={toolbarBtn}
                >
                  ↓
                </button>
                <button
                  onClick={stepOut}
                  title="Step Out (Shift+F11)"
                  style={toolbarBtn}
                >
                  ↑
                </button>
              </>
            )}
          </>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#888' }}>
          {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Variables */}
        <div style={{ borderBottom: '1px solid #3c3c3c' }}>
          <div style={{
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 500,
            background: '#252526',
            textTransform: 'uppercase',
            color: '#888',
          }}>
            Variables
          </div>
          <div style={{ padding: 8 }}>
            {variables.length === 0 ? (
              <div style={{ color: '#888', fontSize: 12 }}>Not paused</div>
            ) : (
              variables.map((v, i) => (
                <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>
                  <span style={{ color: '#9cdcfe' }}>{v.name}</span>
                  <span style={{ color: '#888' }}> = </span>
                  <span style={{ color: '#ce9178' }}>{v.value}</span>
                  <span style={{ color: '#4ec9b0', marginLeft: 8, fontSize: 10 }}>{v.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call Stack */}
        <div style={{ borderBottom: '1px solid #3c3c3c' }}>
          <div style={{
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 500,
            background: '#252526',
            textTransform: 'uppercase',
            color: '#888',
          }}>
            Call Stack
          </div>
          <div style={{ padding: 8 }}>
            {callStack.length === 0 ? (
              <div style={{ color: '#888', fontSize: 12 }}>Not paused</div>
            ) : (
              callStack.map((frame, i) => (
                <div
                  key={frame.id}
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    background: i === 0 ? '#094771' : 'transparent',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ color: '#dcdcaa' }}>{frame.name}</div>
                  <div style={{ color: '#888', fontSize: 10 }}>
                    {frame.file}:{frame.line}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakpoints */}
        <div style={{ borderBottom: '1px solid #3c3c3c' }}>
          <div style={{
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 500,
            background: '#252526',
            textTransform: 'uppercase',
            color: '#888',
          }}>
            Breakpoints ({breakpoints.length})
          </div>
          <div style={{ padding: 8 }}>
            {breakpoints.length === 0 ? (
              <div style={{ color: '#888', fontSize: 12 }}>
                Click on line numbers to add breakpoints
              </div>
            ) : (
              breakpoints.map(bp => (
                <div
                  key={bp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    padding: '4px 0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bp.enabled}
                    onChange={() => onToggleBreakpoint(bp.id)}
                  />
                  <span style={{ flex: 1, color: bp.enabled ? '#fff' : '#888' }}>
                    {bp.file.split('/').pop()}:{bp.line}
                  </span>
                  <button
                    onClick={() => onRemoveBreakpoint(bp.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Console */}
        <div>
          <div style={{
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 500,
            background: '#252526',
            textTransform: 'uppercase',
            color: '#888',
          }}>
            Debug Console
          </div>
          <div style={{
            padding: 8,
            fontFamily: 'monospace',
            fontSize: 11,
            maxHeight: 150,
            overflow: 'auto',
          }}>
            {output.map((line, i) => (
              <div key={i} style={{ color: '#888', padding: '1px 0' }}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const toolbarBtn: React.CSSProperties = {
  padding: '4px 8px',
  background: '#3c3c3c',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};
