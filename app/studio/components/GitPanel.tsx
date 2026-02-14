'use client';

import { useState } from 'react';
import type { Commit, OpenFile, Branch } from '../types';

interface GitPanelProps {
  commits: Commit[];
  branches: Branch[];
  currentBranch: string;
  modifiedFiles: OpenFile[];
  token: string;
  repo: string;
  onBranchChange: (branch: string) => void;
  onCreateBranch: (name: string) => void;
  onSaveFile: (path: string, message: string) => void;
  onRevertFile: (path: string) => void;
  onLoadHistory: (path?: string) => void;
  onRefresh: () => void;
  onViewAtCommit?: (sha: string, path: string) => void;
  onPull?: () => void;
  activeFile?: string;
}

// Status colors
const STATUS_COLORS = {
  modified: { bg: 'rgba(227, 179, 65, 0.15)', color: '#e3b341', icon: 'M', label: 'Modified' },
  added: { bg: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', icon: 'A', label: 'Added' },
  deleted: { bg: 'rgba(248, 81, 73, 0.15)', color: '#f85149', icon: 'D', label: 'Deleted' },
  renamed: { bg: 'rgba(163, 113, 247, 0.15)', color: '#a371f7', icon: 'R', label: 'Renamed' },
  untracked: { bg: 'rgba(139, 148, 158, 0.15)', color: '#8b949e', icon: 'U', label: 'Untracked' },
};

export function GitPanel({
  commits,
  branches,
  currentBranch,
  modifiedFiles,
  token,
  repo,
  onBranchChange,
  onCreateBranch,
  onSaveFile,
  onRevertFile,
  onLoadHistory,
  onRefresh,
  onViewAtCommit,
  onPull,
  activeFile,
}: GitPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [tab, setTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [diff, setDiff] = useState<string>('');

  const handleSync = async () => {
    setSyncing(true);
    await onRefresh();
    setSyncing(false);
  };

  const handlePull = async () => {
    if (!onPull) return;
    setPulling(true);
    await onPull();
    setPulling(false);
  };

  const loadDiff = async (path: string) => {
    setSelectedFile(path);
    try {
      const res = await fetch(
        `/api/github/diff?repo=${repo}&path=${encodeURIComponent(path)}&base=HEAD~1&head=HEAD`,
        { headers: { 'x-gh-token': token } }
      );
      const data = await res.json();
      const file = data.files?.find((f: any) => f.filename === path);
      setDiff(file?.patch || 'No changes');
    } catch {
      setDiff('Error loading diff');
    }
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    modifiedFiles.forEach(f => onSaveFile(f.path, commitMessage));
    setCommitMessage('');
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName);
    setNewBranchName('');
    setShowNewBranch(false);
  };

  const renderDiffLine = (line: string, idx: number) => {
    let bg = 'transparent';
    let color = '#e6edf3';
    let prefix = ' ';
    
    if (line.startsWith('+') && !line.startsWith('+++')) {
      bg = 'rgba(63, 185, 80, 0.15)';
      color = '#3fb950';
      prefix = '+';
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      bg = 'rgba(248, 81, 73, 0.15)';
      color = '#f85149';
      prefix = '-';
    } else if (line.startsWith('@@')) {
      bg = 'rgba(56, 139, 253, 0.15)';
      color = '#58a6ff';
    }
    
    return (
      <div key={idx} style={{ background: bg, color, padding: '1px 8px', fontFamily: 'monospace' }}>
        {line}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
    }}>
      {/* Header with branch and actions */}
      <div style={{ 
        padding: 12, 
        borderBottom: '1px solid #30363d',
        background: 'rgba(22, 27, 34, 0.8)',
      }}>
        {/* Current branch */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(35, 134, 54, 0.3)',
        }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={{ fontWeight: 600, color: '#fff' }}>{currentBranch}</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 500,
              opacity: syncing ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(35, 134, 54, 0.2)',
            }}
          >
            <span style={{ fontSize: 14 }}>↻</span>
            {syncing ? 'Syncing...' : 'Push'}
          </button>
          
          {onPull && (
            <button
              onClick={handlePull}
              disabled={pulling}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: pulling ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 500,
                opacity: pulling ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(31, 111, 235, 0.2)',
              }}
            >
              <span style={{ fontSize: 14 }}>↓</span>
              {pulling ? 'Pulling...' : 'Pull'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d' }}>
        {(['changes', 'history', 'branches'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'history') onLoadHistory(); }}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: tab === t 
                ? 'linear-gradient(180deg, #21262d 0%, #161b22 100%)' 
                : 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #58a6ff' : '2px solid transparent',
              color: tab === t ? '#58a6ff' : '#8b949e',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
              transition: 'all 0.15s ease',
            }}
          >
            {t}
            {t === 'changes' && modifiedFiles.length > 0 && (
              <span style={{ 
                marginLeft: 6, 
                background: 'linear-gradient(135deg, #e3b341 0%, #d29922 100%)', 
                color: '#000', 
                borderRadius: 10, 
                padding: '2px 8px', 
                fontSize: 10,
                fontWeight: 600,
              }}>
                {modifiedFiles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {tab === 'changes' && (
          <div>
            {modifiedFiles.length === 0 ? (
              <div style={{ 
                color: '#8b949e', 
                fontSize: 13, 
                padding: 24, 
                textAlign: 'center',
                background: 'rgba(139, 148, 158, 0.05)',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                <div>No changes to commit</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                  Working tree clean
                </div>
              </div>
            ) : (
              <>
                {/* Modified files list */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 8, fontWeight: 500 }}>
                    STAGED CHANGES ({modifiedFiles.length})
                  </div>
                  {modifiedFiles.map(f => {
                    const status = STATUS_COLORS.modified;
                    return (
                      <div
                        key={f.path}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          background: selectedFile === f.path 
                            ? 'rgba(56, 139, 253, 0.15)' 
                            : 'rgba(255,255,255,0.02)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          marginBottom: 4,
                          border: selectedFile === f.path 
                            ? '1px solid rgba(56, 139, 253, 0.4)' 
                            : '1px solid transparent',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => loadDiff(f.path)}
                      >
                        <span style={{ 
                          background: status.bg,
                          color: status.color,
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}>
                          {status.icon}
                        </span>
                        <span style={{ 
                          flex: 1, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#e6edf3',
                        }}>
                          {f.path}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); onRevertFile(f.path); }}
                          style={{ 
                            background: 'rgba(248, 81, 73, 0.1)', 
                            border: 'none', 
                            color: '#f85149', 
                            cursor: 'pointer', 
                            fontSize: 10,
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontWeight: 500,
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Diff view */}
                {diff && (
                  <div style={{
                    background: '#0d1117',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 16,
                    border: '1px solid #30363d',
                  }}>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#161b22', 
                      borderBottom: '1px solid #30363d',
                      fontSize: 11,
                      color: '#8b949e',
                      fontWeight: 500,
                    }}>
                      DIFF
                    </div>
                    <div style={{
                      fontSize: 11,
                      overflow: 'auto',
                      maxHeight: 200,
                    }}>
                      {diff.split('\n').map((line, idx) => renderDiffLine(line, idx))}
                    </div>
                  </div>
                )}

                {/* Commit form */}
                <div>
                  <textarea
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder="Commit message..."
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: 8,
                      color: '#e6edf3',
                      fontSize: 13,
                      resize: 'vertical',
                      minHeight: 80,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim()}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: 12,
                      background: commitMessage.trim() 
                        ? 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' 
                        : '#21262d',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      cursor: commitMessage.trim() ? 'pointer' : 'not-allowed',
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: commitMessage.trim() 
                        ? '0 4px 12px rgba(35, 134, 54, 0.3)' 
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ✓ Commit {modifiedFiles.length} file{modifiedFiles.length > 1 ? 's' : ''}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {commits.length === 0 ? (
              <div style={{ color: '#8b949e', fontSize: 13, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
                No commits yet
              </div>
            ) : (
              commits.map((c, idx) => (
                <div
                  key={c.sha}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: '1px solid #30363d',
                    position: 'relative',
                  }}
                >
                  {/* Timeline connector */}
                  {idx < commits.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 22,
                      top: 44,
                      bottom: -12,
                      width: 2,
                      background: 'linear-gradient(180deg, #30363d 0%, transparent 100%)',
                    }} />
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar */}
                    {c.author.avatar_url ? (
                      <img
                        src={c.author.avatar_url}
                        alt={c.author.name || 'Commit author'}
                        style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%',
                          border: '2px solid #30363d',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: '#fff',
                        fontWeight: 600,
                      }}>
                        {(c.author.name || c.author.login || '?')[0].toUpperCase()}
                      </div>
                    )}
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Commit message */}
                      <div style={{ 
                        fontWeight: 500, 
                        color: '#e6edf3',
                        fontSize: 13,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.message.split('\n')[0]}
                      </div>
                      
                      {/* Author and date */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        fontSize: 11,
                        color: '#8b949e',
                      }}>
                        <span style={{ fontWeight: 500, color: '#58a6ff' }}>
                          {c.author.name || c.author.login}
                        </span>
                        <span>•</span>
                        <span>{new Date(c.author.date).toLocaleDateString()}</span>
                      </div>
                      
                      {/* SHA */}
                      <div style={{ 
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <code style={{ 
                          background: 'rgba(110, 118, 129, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          color: '#7ee787',
                          fontFamily: 'monospace',
                        }}>
                          {c.sha.slice(0, 7)}
                        </code>
                        {onViewAtCommit && activeFile && (
                          <button
                            onClick={() => onViewAtCommit(c.sha, activeFile)}
                            style={{
                              background: 'rgba(56, 139, 253, 0.1)',
                              border: 'none',
                              color: '#58a6ff',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            View file
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'branches' && (
          <div>
            {/* New branch button */}
            {!showNewBranch ? (
              <button
                onClick={() => setShowNewBranch(true)}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.2)',
                }}
              >
                <span>+</span> New Branch
              </button>
            ) : (
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: '#0d1117', 
                borderRadius: 8,
                border: '1px solid #30363d',
              }}>
                <input
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    color: '#e6edf3',
                    fontSize: 13,
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowNewBranch(false)}
                    style={{
                      flex: 1,
                      padding: 8,
                      background: '#21262d',
                      border: 'none',
                      borderRadius: 6,
                      color: '#8b949e',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim()}
                    style={{
                      flex: 1,
                      padding: 8,
                      background: newBranchName.trim() 
                        ? 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' 
                        : '#21262d',
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      cursor: newBranchName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Branch list */}
            <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 8, fontWeight: 500 }}>
              BRANCHES ({branches.length})
            </div>
            {branches.map(b => (
              <div
                key={b.name}
                onClick={() => onBranchChange(b.name)}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  background: b.name === currentBranch 
                    ? 'linear-gradient(135deg, rgba(35, 134, 54, 0.2) 0%, rgba(46, 160, 67, 0.1) 100%)'
                    : 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 4,
                  border: b.name === currentBranch 
                    ? '1px solid rgba(35, 134, 54, 0.4)' 
                    : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ 
                  fontSize: 14,
                  color: b.name === currentBranch ? '#3fb950' : '#8b949e',
                }}>
                  {b.name === currentBranch ? '●' : '○'}
                </span>
                <span style={{ 
                  flex: 1,
                  color: b.name === currentBranch ? '#3fb950' : '#e6edf3',
                  fontWeight: b.name === currentBranch ? 600 : 400,
                }}>
                  {b.name}
                </span>
                {b.name === currentBranch && (
                  <span style={{
                    background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                  }}>
                    current
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
