'use client';

import { useState } from 'react';

interface Conflict {
  path: string;
  ours: string;
  theirs: string;
  base?: string;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  ourBranch: string;
  theirBranch: string;
  onResolve: (path: string, resolvedContent: string) => void;
  onResolveAll: (resolutions: { path: string; content: string }[]) => void;
  onCancel: () => void;
}

export function ConflictResolver({
  conflicts,
  ourBranch,
  theirBranch,
  onResolve,
  onResolveAll,
  onCancel,
}: ConflictResolverProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const currentConflict = conflicts[currentIndex];
  const resolvedCount = Object.keys(resolutions).length;

  const parseConflictMarkers = (content: string) => {
    const sections: { type: 'ours' | 'theirs' | 'common'; content: string }[] = [];
    const lines = content.split('\n');
    let currentType: 'ours' | 'theirs' | 'common' = 'common';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        if (currentContent.length > 0) {
          sections.push({ type: currentType, content: currentContent.join('\n') });
          currentContent = [];
        }
        currentType = 'ours';
      } else if (line.startsWith('=======')) {
        sections.push({ type: currentType, content: currentContent.join('\n') });
        currentContent = [];
        currentType = 'theirs';
      } else if (line.startsWith('>>>>>>>')) {
        sections.push({ type: currentType, content: currentContent.join('\n') });
        currentContent = [];
        currentType = 'common';
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push({ type: currentType, content: currentContent.join('\n') });
    }

    return sections;
  };

  const acceptOurs = () => {
    if (!currentConflict) return;
    setResolutions(prev => ({ ...prev, [currentConflict.path]: currentConflict.ours }));
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const acceptTheirs = () => {
    if (!currentConflict) return;
    setResolutions(prev => ({ ...prev, [currentConflict.path]: currentConflict.theirs }));
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const acceptBoth = () => {
    if (!currentConflict) return;
    const merged = currentConflict.ours + '\n' + currentConflict.theirs;
    setResolutions(prev => ({ ...prev, [currentConflict.path]: merged }));
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const setCustomResolution = (content: string) => {
    if (!currentConflict) return;
    setResolutions(prev => ({ ...prev, [currentConflict.path]: content }));
  };

  const finishResolving = () => {
    const allResolutions = conflicts.map(c => ({
      path: c.path,
      content: resolutions[c.path] || c.ours,
    }));
    onResolveAll(allResolutions);
  };

  if (!currentConflict) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>All conflicts resolved!</div>
        <button
          onClick={finishResolving}
          style={{
            padding: '12px 24px',
            background: '#238636',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Complete Merge
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: '#252526',
        borderBottom: '1px solid #3c3c3c',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontWeight: 600 }}>Resolve Conflicts</span>
        <span style={{ color: '#888', fontSize: 13 }}>
          {currentIndex + 1} of {conflicts.length}
        </span>
        <span style={{ color: '#7ee787', fontSize: 13 }}>
          {resolvedCount} resolved
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('split')}
            style={{
              padding: '4px 8px',
              background: viewMode === 'split' ? '#0e639c' : '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '4px 8px',
              background: viewMode === 'unified' ? '#0e639c' : '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Unified
          </button>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: '4px 12px',
            background: '#da3633',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Cancel
        </button>
      </div>

      {/* File path */}
      <div style={{
        padding: '8px 16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #3c3c3c',
        fontSize: 13,
        fontFamily: 'monospace',
      }}>
        {currentConflict.path}
      </div>

      {/* Conflict view */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'split' ? (
          <>
            {/* Ours */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #3c3c3c' }}>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(35, 134, 54, 0.2)',
                borderBottom: '1px solid #3c3c3c',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{ourBranch} (ours)</span>
                <button
                  onClick={acceptOurs}
                  style={{
                    padding: '2px 8px',
                    background: '#238636',
                    border: 'none',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Accept
                </button>
              </div>
              <pre style={{
                flex: 1,
                margin: 0,
                padding: 12,
                overflow: 'auto',
                fontSize: 13,
                fontFamily: 'monospace',
                background: 'rgba(35, 134, 54, 0.05)',
              }}>
                {currentConflict.ours}
              </pre>
            </div>

            {/* Theirs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(14, 99, 156, 0.2)',
                borderBottom: '1px solid #3c3c3c',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{theirBranch} (theirs)</span>
                <button
                  onClick={acceptTheirs}
                  style={{
                    padding: '2px 8px',
                    background: '#0e639c',
                    border: 'none',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Accept
                </button>
              </div>
              <pre style={{
                flex: 1,
                margin: 0,
                padding: 12,
                overflow: 'auto',
                fontSize: 13,
                fontFamily: 'monospace',
                background: 'rgba(14, 99, 156, 0.05)',
              }}>
                {currentConflict.theirs}
              </pre>
            </div>
          </>
        ) : (
          // Unified view
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            <div style={{ marginBottom: 8, padding: 8, background: 'rgba(35, 134, 54, 0.1)', borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: '#7ee787', marginBottom: 4 }}>← {ourBranch}</div>
              <pre style={{ margin: 0, fontSize: 13, fontFamily: 'monospace' }}>{currentConflict.ours}</pre>
            </div>
            <div style={{ padding: 8, background: 'rgba(14, 99, 156, 0.1)', borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: '#58a6ff', marginBottom: 4 }}>→ {theirBranch}</div>
              <pre style={{ margin: 0, fontSize: 13, fontFamily: 'monospace' }}>{currentConflict.theirs}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Resolution preview */}
      {resolutions[currentConflict.path] && (
        <div style={{
          borderTop: '1px solid #3c3c3c',
          maxHeight: 150,
          overflow: 'auto',
        }}>
          <div style={{
            padding: '6px 12px',
            background: '#252526',
            fontSize: 12,
            color: '#7ee787',
          }}>
            ✓ Resolved
          </div>
          <pre style={{
            margin: 0,
            padding: 12,
            fontSize: 12,
            fontFamily: 'monospace',
            background: '#1a1a1a',
          }}>
            {resolutions[currentConflict.path]}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: 12,
        background: '#252526',
        borderTop: '1px solid #3c3c3c',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            padding: '8px 12px',
            background: '#3c3c3c',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === 0 ? 0.5 : 1,
          }}
        >
          ← Previous
        </button>
        <button
          onClick={acceptOurs}
          style={{
            padding: '8px 12px',
            background: '#238636',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Accept Ours
        </button>
        <button
          onClick={acceptTheirs}
          style={{
            padding: '8px 12px',
            background: '#0e639c',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Accept Theirs
        </button>
        <button
          onClick={acceptBoth}
          style={{
            padding: '8px 12px',
            background: '#8957e5',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Accept Both
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setCurrentIndex(Math.min(conflicts.length - 1, currentIndex + 1))}
          disabled={currentIndex === conflicts.length - 1}
          style={{
            padding: '8px 12px',
            background: '#3c3c3c',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: currentIndex === conflicts.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentIndex === conflicts.length - 1 ? 0.5 : 1,
          }}
        >
          Next →
        </button>
        {resolvedCount === conflicts.length && (
          <button
            onClick={finishResolving}
            style={{
              padding: '8px 16px',
              background: '#238636',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Complete Merge
          </button>
        )}
      </div>
    </div>
  );
}
