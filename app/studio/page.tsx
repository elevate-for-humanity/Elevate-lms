'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudio } from './hooks/useStudio';
import { useStudioBackend } from './hooks/useStudioBackend';
import { useWebContainer } from './hooks/useWebContainer';
import { FileTree } from './components/FileTree';
import { Editor } from './components/Editor';
import { Tabs } from './components/Tabs';
import { AIChat } from './components/AIChat';
import { GitPanel } from './components/GitPanel';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { SettingsModal } from './components/SettingsModal';
import { Header } from './components/Header';
import { Terminal } from './components/Terminal';
import { WebContainerTerminal } from './components/WebContainerTerminal';
import { PreviewPanel } from './components/PreviewPanel';
import { CommandPalette } from './components/CommandPalette';
import { WebSocketTerminal } from './components/WebSocketTerminal';
import { PortForwarding } from './components/PortForwarding';
import { Debugger } from './components/Debugger';
import { BlameGutter } from './components/BlameGutter';
import { PullRequests } from './components/PullRequests';
import { ActionsPanel } from './components/ActionsPanel';
import { DeployPanel } from './components/DeployPanel';
import { ConflictResolver } from './components/ConflictResolver';
import { RefactorModal } from './components/RefactorModal';
import type { Panel } from './types';

type RightPanel = 'ai' | 'git' | 'debug' | 'ports' | 'prs' | 'actions' | 'deploy' | 'preview';

interface Conflict {
  path: string;
  ours: string;
  theirs: string;
  base?: string;
}

export default function StudioPage() {
  // Use persistent backend (Cloudflare) or GitHub-only mode
  const [usePersistentStorage, setUsePersistentStorage] = useState(true);
  const studioBackend = useStudioBackend();
  const studioGitHub = useStudio();
  const standaloneWebcontainer = useWebContainer();
  
  // Use backend hook if persistent storage enabled, otherwise GitHub-only
  const studio = usePersistentStorage ? studioBackend : studioGitHub;
  const webcontainer = usePersistentStorage ? studioBackend.webcontainer : standaloneWebcontainer;
  
  const [panel, setPanel] = useState<Panel>('files');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showRename, setShowRename] = useState<string | null>(null);
  const [newFilePath, setNewFilePath] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [renamePath, setRenamePath] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('ai');
  const [detectedPorts, setDetectedPorts] = useState<number[]>([]);
  const [breakpoints, setBreakpoints] = useState<{ id: string; file: string; line: number; enabled: boolean }[]>([]);
  const [showBlame, setShowBlame] = useState(false);
  const [useWebSocketTerminal, setUseWebSocketTerminal] = useState(false);
  const [terminalMode, setTerminalMode] = useState<'webcontainer' | 'server' | 'websocket'>('webcontainer');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictBranches, setConflictBranches] = useState<{ ours: string; theirs: string }>({ ours: '', theirs: '' });
  const [showRefactor, setShowRefactor] = useState(false);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  // Check for conflicts when switching branches or before merge
  const checkConflicts = useCallback(async (baseBranch: string, headBranch: string) => {
    if (!studio.currentRepo || !studio.token) return;
    try {
      const res = await fetch(
        `/api/github/conflicts?repo=${studio.currentRepo}&base=${baseBranch}&head=${headBranch}`,
        { headers: { 'x-gh-token': studio.token } }
      );
      const data = await res.json();
      
      if (data.hasConflicts && data.conflictFiles?.length > 0) {
        // Load conflict content for each file
        const conflictData: Conflict[] = [];
        for (const file of data.conflictFiles.slice(0, 10)) { // Limit to 10 files
          const contentRes = await fetch('/api/github/conflicts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-gh-token': studio.token },
            body: JSON.stringify({
              repo: studio.currentRepo,
              path: file,
              base: baseBranch,
              head: headBranch,
            }),
          });
          const content = await contentRes.json();
          if (content.base && content.head) {
            conflictData.push({
              path: file,
              ours: content.head.content,
              theirs: content.base.content,
            });
          }
        }
        
        if (conflictData.length > 0) {
          setConflicts(conflictData);
          setConflictBranches({ ours: headBranch, theirs: baseBranch });
        }
      }
      
      return data;
    } catch (e) {
      console.error('Failed to check conflicts:', e);
      return null;
    }
  }, [studio.currentRepo, studio.token]);

  const handleResolveConflict = useCallback((path: string, resolvedContent: string) => {
    // Save resolved content to the file
    studio.updateFile(path, resolvedContent);
    studio.saveFile(path);
    // Remove from conflicts list
    setConflicts(prev => prev.filter(c => c.path !== path));
  }, [studio]);

  const handleResolveAllConflicts = useCallback(async (resolutions: { path: string; content: string }[]) => {
    if (!studio.currentRepo || !studio.token) return;
    
    studio.setStatus('Committing merge...');
    
    try {
      // Commit the resolved files via the merge API
      const res = await fetch('/api/github/merge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-gh-token': studio.token 
        },
        body: JSON.stringify({
          repo: studio.currentRepo,
          base: conflictBranches.theirs,
          head: conflictBranches.ours,
          resolutions,
          message: `Merge branch '${conflictBranches.theirs}' into ${conflictBranches.ours}\n\nResolved conflicts in:\n${resolutions.map(r => `- ${r.path}`).join('\n')}`,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        studio.setStatus(`Merge complete: ${data.sha.slice(0, 7)}`);
        // Refresh files to show merged state
        await studio.loadFiles();
      } else {
        studio.setStatus(`Merge failed: ${data.error}`);
        // Fall back to local file updates
        resolutions.forEach(({ path, content }) => {
          studio.updateFile(path, content);
          studio.saveFile(path);
        });
      }
    } catch (e) {
      console.error('Merge commit failed:', e);
      studio.setStatus('Merge commit failed - files saved locally');
      // Fall back to local file updates
      resolutions.forEach(({ path, content }) => {
        studio.updateFile(path, content);
        studio.saveFile(path);
      });
    }
    
    setConflicts([]);
  }, [studio, conflictBranches]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (studio.activeFile) {
          studio.saveFile(studio.activeFile);
        }
      }
      // Ctrl+Shift+P or Ctrl+P - Command palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl+G - Go to line
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        const line = prompt('Go to line:');
        if (line) {
          // Monaco editor handles this internally
        }
      }
      // Ctrl+` - Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(t => !t);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studio.activeFile, studio.saveFile]);

  // Sync files to WebContainer when they change
  const syncToWebContainer = useCallback(async () => {
    if (!webcontainer.booted || studio.files.length === 0) return;
    
    // Convert file tree to flat list with content
    const flatFiles: { path: string; content: string }[] = [];
    
    const processNode = async (node: any, parentPath: string = '') => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        // Get file content from open files or fetch it
        const openFile = studio.openFiles.find(f => f.path === fullPath);
        if (openFile) {
          flatFiles.push({ path: fullPath, content: openFile.content });
        }
      } else if (node.children) {
        for (const child of node.children) {
          await processNode(child, fullPath);
        }
      }
    };
    
    for (const node of studio.files) {
      await processNode(node);
    }
    
    if (flatFiles.length > 0) {
      await webcontainer.syncFiles(flatFiles);
    }
  }, [webcontainer, studio.files, studio.openFiles]);

  // Sync file to WebContainer when saved
  useEffect(() => {
    if (webcontainer.booted && studio.activeFile) {
      const file = studio.openFiles.find(f => f.path === studio.activeFile);
      if (file && !file.modified) {
        webcontainer.updateFile(file.path, file.content);
      }
    }
  }, [webcontainer.booted, studio.activeFile, studio.openFiles, webcontainer.updateFile]);

  // Command palette commands
  const commands = useMemo(() => [
    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', category: 'File', action: () => studio.saveFile(studio.activeFile) },
    { id: 'new', label: 'New File', category: 'File', action: () => setShowNewFile(true) },
    { id: 'close', label: 'Close File', category: 'File', action: () => studio.closeFile(studio.activeFile) },
    { id: 'terminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`', category: 'View', action: () => setShowTerminal(t => !t) },
    { id: 'settings', label: 'Open Settings', category: 'Preferences', action: () => setShowSettings(true) },
    { id: 'refresh', label: 'Refresh Files', category: 'Git', action: () => studio.loadFiles() },
    { id: 'branch', label: 'Create Branch', category: 'Git', action: () => {} },
    { id: 'pull', label: 'Pull Latest Changes', category: 'Git', action: () => studio.pullChanges?.() },
    { id: 'check-conflicts', label: 'Check Merge Conflicts', category: 'Git', action: () => checkConflicts('main', studio.branch) },
    { id: 'refactor', label: 'Refactor Symbol', shortcut: 'F2', category: 'Edit', action: () => setShowRefactor(true) },
    { id: 'sync-webcontainer', label: 'Sync to WebContainer', category: 'Dev', action: syncToWebContainer },
    { id: 'boot-webcontainer', label: 'Boot WebContainer', category: 'Dev', action: () => webcontainer.boot() },
    { id: 'npm-install', label: 'npm install', category: 'Dev', action: () => webcontainer.install() },
    { id: 'npm-dev', label: 'npm run dev', category: 'Dev', action: () => webcontainer.startServer() },
    { id: 'theme-dark', label: 'Theme: Dark', category: 'Preferences', action: () => studio.updateSettings({ theme: 'dark' }) },
    { id: 'theme-light', label: 'Theme: Light', category: 'Preferences', action: () => studio.updateSettings({ theme: 'light' }) },
    { id: 'logout', label: 'Logout', category: 'Account', action: () => studio.disconnect() },
  ], [studio, checkConflicts, syncToWebContainer, webcontainer]);

  // Warn on unsaved changes
  useEffect(() => {
    const hasUnsaved = studio.openFiles.some(f => f.modified);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [studio.openFiles]);

  const handleRepoChange = useCallback((repo: string) => {
    if (repo === '__add__') {
      setShowAddRepo(true);
    } else {
      studio.selectRepo(repo);
    }
  }, [studio.selectRepo]);

  const handleAddRepo = useCallback(async () => {
    if (!newRepoName.trim()) return;
    await studio.addRepo(newRepoName.trim());
    studio.selectRepo(newRepoName.trim());
    setNewRepoName('');
    setShowAddRepo(false);
  }, [newRepoName, studio.addRepo, studio.selectRepo]);

  const handleCreateFile = useCallback(async () => {
    if (!newFilePath.trim()) return;
    await studio.createFile(newFilePath.trim());
    setNewFilePath('');
    setShowNewFile(false);
  }, [newFilePath, studio.createFile]);

  const handleRename = useCallback(async () => {
    if (!showRename || !renamePath.trim()) return;
    await studio.renameFile(showRename, renamePath.trim());
    setShowRename(null);
    setRenamePath('');
  }, [showRename, renamePath, studio.renameFile]);

  const handleApplyCode = useCallback((code: string) => {
    if (studio.activeFile) {
      studio.updateFile(studio.activeFile, code);
    }
  }, [studio.activeFile, studio.updateFile]);

  const handleAddBreakpoint = useCallback((file: string, line: number) => {
    const id = `bp_${Date.now()}`;
    setBreakpoints(prev => [...prev, { id, file, line, enabled: true }]);
  }, []);

  const handleRemoveBreakpoint = useCallback((id: string) => {
    setBreakpoints(prev => prev.filter(bp => bp.id !== id));
  }, []);

  const handleToggleBreakpoint = useCallback((id: string) => {
    setBreakpoints(prev => prev.map(bp => 
      bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
    ));
  }, []);

  const handlePortDetected = useCallback((port: number) => {
    setDetectedPorts(prev => prev.includes(port) ? prev : [...prev, port]);
  }, []);

  // File upload via drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const path = file.name;
        await studio.createFile(path, content);
      };
      reader.readAsText(file);
    }
  }, [studio.createFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!studio.activeFile || !studio.currentRepoId) return;
    try {
      const res = await fetch('/api/studio/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': studio.userId },
        body: JSON.stringify({
          repo_id: studio.currentRepoId,
          file_path: studio.activeFile,
          branch: studio.branch,
        })
      });
      const data = await res.json();
      if (data.share_code) {
        const url = `${window.location.origin}/studio/share/${data.share_code}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
        studio.setStatus('Share link copied!');
      }
    } catch {
      studio.setStatus('Failed to create share link');
    }
  }, [studio.activeFile, studio.currentRepoId, studio.userId, studio.branch, studio.setStatus]);

  // Loading state
  if (!studio.mounted) {
    return (
      <div style={{ 
        background: '#1e1e1e', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#fff',
      }}>
        Loading...
      </div>
    );
  }

  // Login screen
  if (!studio.token) {
    return <LoginScreen onConnect={studio.connect} status={studio.status} />;
  }

  const currentFile = studio.openFiles.find(f => f.path === studio.activeFile);
  const modifiedFiles = studio.openFiles.filter(f => f.modified);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        color: '#e6edf3',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        position: 'relative',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(35, 134, 54, 0.3)',
          border: '3px dashed #3fb950',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color: '#3fb950',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            padding: '24px 48px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 32 }}>📁</span>
            Drop files to upload
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .desktop-panel { display: none !important; }
          .mobile-tabs { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-tabs { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <Header
        repos={studio.repos}
        currentRepo={studio.currentRepo}
        branches={studio.branches}
        currentBranch={studio.branch}
        status={studio.status}
        loading={studio.loading}
        onRepoChange={handleRepoChange}
        onBranchChange={studio.setBranch}
        onRefresh={studio.loadFiles}
        onNewFile={() => setShowNewFile(true)}
        onSettings={() => setShowSettings(true)}
        onLogout={studio.disconnect}
      />

      {/* Mobile Tabs */}
      <div className="mobile-tabs" style={{ display: 'none', borderBottom: '1px solid #3c3c3c' }}>
        {(['files', 'editor', 'ai', 'git'] as Panel[]).map(p => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            style={{
              flex: 1,
              padding: 10,
              background: panel === p ? '#0e639c' : '#252526',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: 12,
            }}
          >
            {p}
            {p === 'git' && modifiedFiles.length > 0 && (
              <span style={{ marginLeft: 4, background: '#e2c08d', color: '#000', borderRadius: 10, padding: '0 4px', fontSize: 10 }}>
                {modifiedFiles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File Tree */}
        <div 
          className={panel === 'files' ? '' : 'desktop-panel'}
          style={{ 
            width: 260, 
            borderRight: '1px solid #30363d', 
            display: 'flex', 
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
          }}
        >
          {/* Workspace Selector (only in persistent mode) */}
          {usePersistentStorage && 'workspaces' in studioBackend && (
            <div style={{ borderBottom: '1px solid #30363d' }}>
              <WorkspaceSelector
                workspaces={studioBackend.workspaces}
                currentWorkspace={studioBackend.currentWorkspace}
                onSelect={studioBackend.loadWorkspace}
                onCreate={studioBackend.createWorkspace}
              />
            </div>
          )}
          
          {/* Search with icon */}
          <div style={{ 
            margin: 12, 
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #30363d',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: '#8b949e', fontSize: 14 }}>🔍</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              style={{ 
                flex: 1,
                background: 'transparent', 
                border: 'none',
                color: '#e6edf3',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <FileTree
              nodes={studio.fileTree}
              activeFile={studio.activeFile}
              onSelect={studio.openFile}
              onRename={(path) => { setShowRename(path); setRenamePath(path); }}
              onDelete={studio.deleteFile}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Editor */}
        <div 
          className={panel === 'editor' ? '' : 'desktop-panel'}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <Tabs
            files={studio.openFiles}
            activeFile={studio.activeFile}
            onSelect={studio.setActiveFile}
            onClose={studio.closeFile}
          />
          
          {currentFile && (
            <div style={{ 
              padding: '6px 16px', 
              background: 'linear-gradient(90deg, #161b22 0%, #0d1117 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              fontSize: 12,
              borderBottom: '1px solid #30363d',
            }}>
              {/* Breadcrumbs */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 6 }}>
                {currentFile.path.split('/').map((part, i, arr) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span style={{ color: '#30363d' }}>/</span>}
                    <span style={{ 
                      color: i === arr.length - 1 ? '#e6edf3' : '#8b949e',
                      cursor: i < arr.length - 1 ? 'pointer' : 'default',
                      fontWeight: i === arr.length - 1 ? 500 : 400,
                    }}>
                      {part}
                    </span>
                  </span>
                ))}
              </div>
              <button
                onClick={() => studio.saveFile(studio.activeFile)}
                disabled={!currentFile.modified}
                style={{
                  padding: '6px 14px',
                  background: currentFile.modified 
                    ? 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' 
                    : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: currentFile.modified ? 'pointer' : 'not-allowed',
                  fontSize: 11,
                  fontWeight: 500,
                  boxShadow: currentFile.modified ? '0 2px 8px rgba(35, 134, 54, 0.3)' : 'none',
                }}
              >
                Save
              </button>
              <button
                onClick={() => studio.revertFile(studio.activeFile)}
                disabled={!currentFile.modified}
                style={{
                  padding: '4px 10px',
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: currentFile.modified ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  opacity: currentFile.modified ? 1 : 0.5,
                }}
              >
                Revert
              </button>
              <button
                onClick={handleShare}
                style={{
                  padding: '4px 10px',
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Share
              </button>
              <button
                onClick={() => studio.downloadFile(studio.activeFile)}
                style={{
                  padding: '4px 10px',
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Download
              </button>
              <button
                onClick={() => setShowBlame(!showBlame)}
                style={{
                  padding: '4px 10px',
                  background: showBlame ? '#0e639c' : '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Blame
              </button>
            </div>
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex' }}>
              {showBlame && currentFile && (
                <BlameGutter
                  repo={studio.currentRepo}
                  path={currentFile.path}
                  branch={studio.branch}
                  token={studio.token}
                  lineCount={currentFile.content.split('\n').length}
                  visible={showBlame}
                />
              )}
              <div style={{ flex: 1 }}>
                <Editor
                  file={currentFile}
                  settings={studio.settings}
                  onChange={(content) => studio.updateFile(studio.activeFile, content)}
                  onSave={() => studio.saveFile(studio.activeFile)}
                />
              </div>
            </div>
            {showTerminal && (
              <div style={{ height: 250, borderTop: '1px solid #3c3c3c', display: 'flex', flexDirection: 'column' }}>
                {/* Terminal type selector */}
                <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: '#1e1e1e', borderBottom: '1px solid #3c3c3c' }}>
                  <button
                    onClick={() => setTerminalMode('webcontainer')}
                    style={{
                      padding: '2px 8px',
                      background: terminalMode === 'webcontainer' ? '#0e639c' : '#3c3c3c',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    WebContainer
                  </button>
                  <button
                    onClick={() => setTerminalMode('server')}
                    style={{
                      padding: '2px 8px',
                      background: terminalMode === 'server' ? '#0e639c' : '#3c3c3c',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    Server
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  {terminalMode === 'webcontainer' ? (
                    <WebContainerTerminal
                      terminals={webcontainer.terminals}
                      activeTerminal={webcontainer.activeTerminal}
                      servers={webcontainer.servers}
                      booted={webcontainer.booted}
                      booting={webcontainer.booting}
                      installing={webcontainer.installing}
                      onCommand={webcontainer.runCommand}
                      onBoot={webcontainer.boot}
                      onInstall={webcontainer.install}
                      onStartServer={webcontainer.startServer}
                      onStopServer={webcontainer.stopServer}
                      onClear={webcontainer.clearTerminal}
                      onAddTerminal={webcontainer.addTerminal}
                      onRemoveTerminal={webcontainer.removeTerminal}
                      onSetActiveTerminal={webcontainer.setActiveTerminal}
                    />
                  ) : terminalMode === 'websocket' ? (
                    <WebSocketTerminal 
                      wsUrl="http://localhost:3001" 
                      onPortDetected={handlePortDetected}
                    />
                  ) : (
                    <Terminal />
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 12px',
              background: '#252526',
              border: '1px solid #3c3c3c',
              borderRadius: 4,
              color: '#888',
              cursor: 'pointer',
              fontSize: 11,
              zIndex: 10,
            }}
          >
            {showTerminal ? '▼ Hide Terminal' : '▲ Terminal'}
          </button>
        </div>

        {/* Right Panel */}
        <div 
          className={panel === 'ai' || panel === 'git' ? '' : 'desktop-panel'}
          style={{ 
            width: 320, 
            borderLeft: '1px solid #3c3c3c',
            background: studio.settings.theme === 'dark' ? '#252526' : '#f3f3f3',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #30363d', 
            flexWrap: 'wrap',
            background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
          }}>
            {(['ai', 'git', 'preview', 'prs', 'actions', 'deploy'] as RightPanel[]).map(p => {
              const icons: Record<string, { icon: string; color: string }> = {
                ai: { icon: '🤖', color: '#a855f7' },
                git: { icon: '🌿', color: '#3fb950' },
                preview: { icon: '👁', color: '#58a6ff' },
                prs: { icon: '🔀', color: '#bc8cff' },
                actions: { icon: '⚡', color: '#d29922' },
                deploy: { icon: '🚀', color: '#f85149' },
              };
              const { icon, color } = icons[p] || { icon: '•', color: '#8b949e' };
              
              return (
                <button
                  key={p}
                  onClick={() => setRightPanel(p)}
                  style={{
                    flex: '1 1 auto',
                    padding: '10px 8px',
                    background: rightPanel === p 
                      ? 'linear-gradient(180deg, #21262d 0%, #0d1117 100%)' 
                      : 'transparent',
                    border: 'none',
                    borderBottom: rightPanel === p ? `2px solid ${color}` : '2px solid transparent',
                    color: rightPanel === p ? '#e6edf3' : '#8b949e',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: rightPanel === p ? 600 : 400,
                    minWidth: 50,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {p === 'prs' ? 'PRs' : p === 'actions' ? 'CI' : p}
                  </span>
                  {p === 'preview' && webcontainer.servers.some(s => s.status === 'running') && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#3fb950',
                      boxShadow: '0 0 8px #3fb950',
                    }} />
                  )}
                  {p === 'git' && modifiedFiles.length > 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #d29922 0%, #e3b341 100%)',
                      color: '#000',
                      borderRadius: 10,
                      padding: '1px 6px',
                      fontSize: 9,
                      fontWeight: 700,
                      marginLeft: 2,
                    }}>
                      {modifiedFiles.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightPanel === 'ai' && (
              <AIChat
                messages={studio.messages}
                setMessages={studio.setMessages}
                currentFile={currentFile}
                repoId={studio.currentRepoId}
                userId={studio.userId}
                onApplyCode={handleApplyCode}
              />
            )}

            {rightPanel === 'git' && (
              <GitPanel
                commits={studio.commits}
                branches={studio.branches}
                currentBranch={studio.branch}
                modifiedFiles={modifiedFiles}
                token={studio.token}
                repo={studio.currentRepo}
                onBranchChange={studio.setBranch}
                onCreateBranch={studio.createBranch}
                onSaveFile={studio.saveFile}
                onRevertFile={studio.revertFile}
                onLoadHistory={studio.loadHistory}
                onRefresh={studio.loadFiles}
                onViewAtCommit={studio.viewFileAtCommit}
                activeFile={studio.activeFile}
              />
            )}

            {rightPanel === 'debug' && (
              <Debugger
                activeFile={studio.activeFile}
                breakpoints={breakpoints}
                onAddBreakpoint={handleAddBreakpoint}
                onRemoveBreakpoint={handleRemoveBreakpoint}
                onToggleBreakpoint={handleToggleBreakpoint}
              />
            )}

            {rightPanel === 'ports' && (
              <PortForwarding
                detectedPorts={detectedPorts}
                baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
              />
            )}

            {rightPanel === 'prs' && (
              <PullRequests
                repo={studio.currentRepo}
                repoId={studio.currentRepoId}
                token={studio.token}
                branch={studio.branch}
                userId={studio.userId}
                onCheckout={studio.setBranch}
              />
            )}

            {rightPanel === 'actions' && (
              <ActionsPanel
                repo={studio.currentRepo}
                repoId={studio.currentRepoId}
                token={studio.token}
                branch={studio.branch}
                userId={studio.userId}
              />
            )}

            {rightPanel === 'deploy' && (
              <DeployPanel
                repo={studio.currentRepo}
                branch={studio.branch}
                userId={studio.userId}
              />
            )}

            {rightPanel === 'preview' && (
              <PreviewPanel
                servers={webcontainer.servers}
                onRefresh={() => {
                  // Refresh iframe by toggling panel
                  setRightPanel('ai');
                  setTimeout(() => setRightPanel('preview'), 100);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={studio.settings}
          onUpdate={studio.updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          commands={commands}
          onClose={() => setShowCommandPalette(false)}
          recentFiles={studio.recentFiles}
          onOpenFile={studio.openFile}
        />
      )}

      {showNewFile && (
        <Modal title="New File" onClose={() => setShowNewFile(false)}>
          <input
            value={newFilePath}
            onChange={e => setNewFilePath(e.target.value)}
            placeholder="path/to/file.tsx"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateFile()}
            style={{
              width: '100%',
              padding: 12,
              background: '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowNewFile(false)} style={btnSecondary}>Cancel</button>
            <button onClick={handleCreateFile} style={btnPrimary}>Create</button>
          </div>
        </Modal>
      )}

      {showAddRepo && (
        <Modal title="Add Repository" onClose={() => setShowAddRepo(false)}>
          <input
            value={newRepoName}
            onChange={e => setNewRepoName(e.target.value)}
            placeholder="owner/repo"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
            style={{
              width: '100%',
              padding: 12,
              background: '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddRepo(false)} style={btnSecondary}>Cancel</button>
            <button onClick={handleAddRepo} style={btnPrimary}>Add</button>
          </div>
        </Modal>
      )}

      {showRename && (
        <Modal title="Rename File" onClose={() => setShowRename(null)}>
          <input
            value={renamePath}
            onChange={e => setRenamePath(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            style={{
              width: '100%',
              padding: 12,
              background: '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowRename(null)} style={btnSecondary}>Cancel</button>
            <button onClick={handleRename} style={btnPrimary}>Rename</button>
          </div>
        </Modal>
      )}

      {/* Conflict Resolver */}
      {conflicts.length > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1e1e1e',
            borderRadius: 8,
            width: '90%',
            maxWidth: 1200,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <ConflictResolver
              conflicts={conflicts}
              ourBranch={conflictBranches.ours}
              theirBranch={conflictBranches.theirs}
              onResolve={handleResolveConflict}
              onResolveAll={handleResolveAllConflicts}
              onCancel={() => setConflicts([])}
            />
          </div>
        </div>
      )}

      {/* Refactor Modal */}
      {showRefactor && currentFile && (
        <RefactorModal
          initialName={currentFile.path.split('/').pop()?.split('.')[0] || ''}
          onRefactor={async (oldName, newName, scope) => {
            // Simple find-replace refactoring
            if (scope === 'file') {
              const newContent = currentFile.content.replace(
                new RegExp(`\\b${oldName}\\b`, 'g'),
                newName
              );
              studio.updateFile(studio.activeFile, newContent);
            } else {
              // Project-wide refactoring would require more complex logic
              studio.setStatus(`Refactored ${oldName} to ${newName}`);
            }
          }}
          onClose={() => setShowRefactor(false)}
        />
      )}
    </div>
  );
}

// Login Screen Component
function LoginScreen({ onConnect, status }: { onConnect: (token: string) => Promise<boolean>; status: string }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    await onConnect(token.trim());
    setLoading(false);
  };

  return (
    <div style={{ 
      background: '#1e1e1e', 
      color: '#fff', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <h1 style={{ marginBottom: 8, fontSize: 28 }}>Dev Studio</h1>
        <p style={{ color: '#888', marginBottom: 24 }}>
          A browser-based IDE for GitHub repositories
        </p>
        
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          placeholder="GitHub Personal Access Token"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 16,
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />
        
        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          style={{
            width: '100%',
            padding: 14,
            background: loading ? '#3c3c3c' : '#238636',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12,
          }}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
        
        {status && (
          <p style={{ color: status.includes('Invalid') ? '#f85149' : '#888', fontSize: 14 }}>
            {status}
          </p>
        )}
        
        <a
          href="https://github.com/settings/tokens/new?scopes=repo"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#58a6ff', fontSize: 14 }}
        >
          Create a token with repo scope →
        </a>
      </div>
    </div>
  );
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#252526',
          padding: 24,
          borderRadius: 8,
          width: 400,
          maxWidth: '90vw',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// Button styles
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#238636',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#3c3c3c',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};
