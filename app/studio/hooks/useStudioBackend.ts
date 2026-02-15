'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { studioAPI } from '../lib/studio-api';
import { useWebContainer } from './useWebContainer';
import type { FileNode, OpenFile, Settings, Branch, Commit, Repo, Message } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  autoSave: false,
};

/**
 * Studio Backend Hook - Full IDE with persistent storage
 * 
 * Uses Cloudflare Workers (R2 + Durable Objects + D1) for:
 * - Persistent file storage
 * - Real terminal sessions
 * - Workspace management
 * 
 * Uses WebContainer for:
 * - npm/node/npx execution
 * - Live preview
 */
export function useStudioBackend() {
  // Auth state
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  
  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  
  // GitHub integration
  const [repos, setRepos] = useState<Repo[]>([]);
  const [currentRepo, setCurrentRepo] = useState('');
  const [currentRepoId, setCurrentRepoId] = useState('');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // File state
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState('');
  const [files, setFiles] = useState<Map<string, string>>(new Map());
  
  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<{ file_path: string; accessed_at: string }[]>([]);

  // WebContainer for npm/node
  const webcontainer = useWebContainer();
  
  // Terminal connection ref
  const terminalRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('studio_token');
      const savedUserId = localStorage.getItem('studio_user_id');
      const savedWorkspaceId = localStorage.getItem('studio_workspace_id');
      const savedSettings = localStorage.getItem('studio_settings');
      
      if (savedToken) {
        setToken(savedToken);
        studioAPI.setToken(savedToken);
      }
      if (savedUserId) setUserId(savedUserId);
      if (savedSettings) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        } catch {
          // Non-critical operation — silent failure acceptable
        }
      }
      
      if (savedToken) {
        try {
          const ws = await studioAPI.listWorkspaces();
          setWorkspaces(ws);
          
          if (savedWorkspaceId) {
            const workspace = ws.find(w => w.id === savedWorkspaceId);
            if (workspace) {
              loadWorkspaceInternal(workspace.id);
            }
          }
        } catch (e) {
          console.error('Failed to load workspaces:', e);
        }
      }
      
      setMounted(true);
    };
    
    init();
  }, []);

  // Save settings
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('studio_settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const headers = useCallback(() => ({
    'x-gh-token': token,
    'x-user-id': userId,
    'Content-Type': 'application/json',
  }), [token, userId]);

  // Build file tree from flat list
  const buildTree = useCallback((fileList: { path: string; isDirectory: boolean }[]): FileNode[] => {
    const root: FileNode[] = [];
    const map: Record<string, FileNode> = {};

    fileList
      .filter(f => !f.path.includes('node_modules') && !f.path.includes('.next') && !f.path.includes('.git'))
      .forEach(f => {
        const parts = f.path.split('/');
        let current = root;
        let currentPath = '';

        parts.forEach((part, i) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const isFile = i === parts.length - 1 && !f.isDirectory;

          if (!map[currentPath]) {
            const node: FileNode = {
              path: currentPath,
              sha: '',
              type: isFile ? 'file' : 'folder',
              children: isFile ? undefined : []
            };
            map[currentPath] = node;
            current.push(node);
          }
          if (!isFile) current = map[currentPath].children!;
        });
      });

    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.path.localeCompare(b.path);
      });
      nodes.forEach(n => n.children && sortNodes(n.children));
    };
    sortNodes(root);
    return root;
  }, []);

  // Internal workspace loader
  const loadWorkspaceInternal = async (workspaceId: string) => {
    setLoading(true);
    setStatus('Loading workspace...');
    
    try {
      const workspace = await studioAPI.getWorkspace(workspaceId);
      setCurrentWorkspace(workspace);
      localStorage.setItem('studio_workspace_id', workspaceId);
      
      const fileList = await studioAPI.listFiles(workspaceId);
      
      const allFiles: { path: string; isDirectory: boolean }[] = [
        ...fileList.directories.map(d => ({ path: d, isDirectory: true })),
        ...fileList.files.map(f => ({ path: f.path, isDirectory: false })),
      ];
      
      const tree = buildTree(allFiles);
      setFileTree(tree);
      
      const fileMap = new Map<string, string>();
      for (const file of fileList.files) {
        try {
          const content = await studioAPI.readFile(workspaceId, file.path);
          fileMap.set(file.path, content);
        } catch {
          // Non-critical operation — silent failure acceptable
        }
      }
      setFiles(fileMap);
      
      if (fileMap.size > 0) {
        const flatFiles = Array.from(fileMap.entries()).map(([path, content]) => ({ path, content }));
        await webcontainer.syncFiles(flatFiles);
      }
      
      setStatus(`Loaded ${fileMap.size} files`);
      
      if (workspace.repoUrl) {
        const match = workspace.repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
        if (match) {
          setCurrentRepo(match[1].replace('.git', ''));
        }
      }
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Failed to load'}`);
    }
    
    setLoading(false);
  };

  // Connect with GitHub token
  const connect = useCallback(async (inputToken: string) => {
    setStatus('Validating...');
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${inputToken}` }
      });
      if (!res.ok) throw new Error('Invalid token');
      const user = await res.json();
      
      localStorage.setItem('studio_token', inputToken);
      localStorage.setItem('studio_user_id', user.id.toString());
      setToken(inputToken);
      setUserId(user.id.toString());
      studioAPI.setToken(inputToken);
      
      const ws = await studioAPI.listWorkspaces();
      setWorkspaces(ws);
      
      setStatus(`Connected as ${user.login}`);
      return true;
    } catch (e) {
      setStatus('Invalid token');
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('studio_token');
    localStorage.removeItem('studio_user_id');
    localStorage.removeItem('studio_workspace_id');
    setToken('');
    setUserId('');
    setCurrentWorkspace(null);
    setWorkspaces([]);
    setFileTree([]);
    setOpenFiles([]);
    setFiles(new Map());
    setBranches([]);
    setMessages([]);
  }, []);

  // Load workspace
  const loadWorkspace = useCallback(async (workspaceId: string) => {
    await loadWorkspaceInternal(workspaceId);
  }, [buildTree, webcontainer]);

  // Create workspace
  const createWorkspace = useCallback(async (name: string, description?: string, repoUrl?: string) => {
    setLoading(true);
    setStatus('Creating workspace...');
    
    try {
      const workspace = await studioAPI.createWorkspace(name, description, repoUrl);
      setWorkspaces(prev => [...prev, workspace]);
      
      if (repoUrl) {
        setStatus('Cloning repository...');
        await studioAPI.cloneRepo(workspace.id, repoUrl);
      }
      
      await loadWorkspaceInternal(workspace.id);
      return workspace;
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
      setLoading(false);
      return null;
    }
  }, []);

  // Open file
  const openFile = useCallback(async (path: string) => {
    const existing = openFiles.find(f => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    if (!currentWorkspace) {
      setStatus('No workspace loaded');
      return;
    }

    setStatus(`Opening ${path}...`);
    
    try {
      let content = files.get(path);
      
      if (content === undefined) {
        content = await studioAPI.readFile(currentWorkspace.id, path);
        setFiles(prev => new Map(prev).set(path, content!));
      }

      const language = getLanguageFromPath(path);
      
      setOpenFiles(prev => [...prev, {
        path,
        content,
        originalContent: content,
        sha: '',
        language,
        modified: false
      }]);
      setActiveFile(path);
      setStatus('');
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  }, [openFiles, currentWorkspace, files]);

  // Close file
  const closeFile = useCallback((path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (file?.modified && !confirm('Discard unsaved changes?')) return;
    
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setActiveFile(remaining[remaining.length - 1]?.path || '');
    }
  }, [openFiles, activeFile]);

  // Update file content locally
  const updateFile = useCallback((path: string, content: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, content, modified: content !== f.originalContent } : f
    ));
    setFiles(prev => new Map(prev).set(path, content));
    webcontainer.updateFile(path, content);
  }, [webcontainer]);

  // Save file
  const saveFile = useCallback(async (path: string, commitMessage?: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file || !currentWorkspace) return false;

    setStatus(`Saving ${path}...`);
    
    try {
      await studioAPI.writeFile(currentWorkspace.id, path, file.content);
      
      setOpenFiles(prev => prev.map(f =>
        f.path === path ? { ...f, originalContent: f.content, modified: false } : f
      ));
      
      if (currentRepo && token && commitMessage) {
        const res = await fetch('/api/github/file', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
          body: JSON.stringify({
            repo: currentRepo,
            path,
            content: file.content,
            sha: file.sha,
            branch,
            message: commitMessage
          })
        });
        const data = await res.json();
        if (!data.error) {
          setStatus(`Saved & committed: ${data.commit?.slice(0, 7) || 'done'}`);
          return true;
        }
      }
      
      setStatus('Saved');
      return true;
    } catch (e) {
      setStatus(`Save failed: ${e}`);
      return false;
    }
  }, [openFiles, currentWorkspace, currentRepo, token, branch]);

  // Revert file
  const revertFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, content: f.originalContent, modified: false } : f
    ));
  }, []);

  // Create file
  const createFile = useCallback(async (path: string, content = '') => {
    if (!currentWorkspace) {
      setStatus('No workspace loaded');
      return false;
    }

    setStatus(`Creating ${path}...`);
    
    try {
      await studioAPI.writeFile(currentWorkspace.id, path, content);
      setFiles(prev => new Map(prev).set(path, content));
      
      const fileList = await studioAPI.listFiles(currentWorkspace.id);
      const allFiles = [
        ...fileList.directories.map(d => ({ path: d, isDirectory: true })),
        ...fileList.files.map(f => ({ path: f.path, isDirectory: false })),
      ];
      setFileTree(buildTree(allFiles));
      
      await openFile(path);
      webcontainer.updateFile(path, content);
      
      setStatus('Created');
      return true;
    } catch (e) {
      setStatus(`Create failed: ${e}`);
      return false;
    }
  }, [currentWorkspace, buildTree, openFile, webcontainer]);

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    if (!currentWorkspace) return false;
    if (!confirm(`Delete ${path}?`)) return false;

    try {
      await studioAPI.deleteFile(currentWorkspace.id, path);
      
      setFiles(prev => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
      closeFile(path);
      
      const fileList = await studioAPI.listFiles(currentWorkspace.id);
      const allFiles = [
        ...fileList.directories.map(d => ({ path: d, isDirectory: true })),
        ...fileList.files.map(f => ({ path: f.path, isDirectory: false })),
      ];
      setFileTree(buildTree(allFiles));
      
      setStatus('Deleted');
      return true;
    } catch (e) {
      setStatus(`Delete failed: ${e}`);
      return false;
    }
  }, [currentWorkspace, closeFile, buildTree]);

  // Rename file
  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    if (!currentWorkspace) return false;

    try {
      const content = files.get(oldPath) || '';
      await studioAPI.writeFile(currentWorkspace.id, newPath, content);
      await studioAPI.deleteFile(currentWorkspace.id, oldPath);
      
      setFiles(prev => {
        const next = new Map(prev);
        next.delete(oldPath);
        next.set(newPath, content);
        return next;
      });
      
      setOpenFiles(prev => prev.map(f =>
        f.path === oldPath ? { ...f, path: newPath } : f
      ));
      if (activeFile === oldPath) setActiveFile(newPath);
      
      const fileList = await studioAPI.listFiles(currentWorkspace.id);
      const allFiles = [
        ...fileList.directories.map(d => ({ path: d, isDirectory: true })),
        ...fileList.files.map(f => ({ path: f.path, isDirectory: false })),
      ];
      setFileTree(buildTree(allFiles));
      
      setStatus('Renamed');
      return true;
    } catch (e) {
      setStatus(`Rename failed: ${e}`);
      return false;
    }
  }, [currentWorkspace, files, activeFile, buildTree]);

  // Run command
  const runCommand = useCallback(async (command: string) => {
    if (!currentWorkspace) {
      return { output: 'No workspace loaded', exitCode: 1 };
    }

    const cmd = command.trim().split(' ')[0];

    // npm/node go to WebContainer
    if (['npm', 'node', 'npx', 'yarn', 'pnpm'].includes(cmd)) {
      if (!webcontainer.booted) {
        await webcontainer.boot();
        const flatFiles = Array.from(files.entries()).map(([path, content]) => ({ path, content }));
        if (flatFiles.length > 0) {
          await webcontainer.syncFiles(flatFiles);
        }
      }
      
      const exitCode = await webcontainer.runCommand(command);
      return { output: '', exitCode };
    }

    // Other commands go to Cloudflare
    return studioAPI.executeCommand(currentWorkspace.id, command);
  }, [currentWorkspace, webcontainer, files]);

  // Clone repo
  const cloneRepo = useCallback(async (repoUrl: string, branchName?: string) => {
    if (!currentWorkspace) {
      setStatus('No workspace loaded');
      return false;
    }

    setLoading(true);
    setStatus('Cloning repository...');
    
    try {
      const result = await studioAPI.cloneRepo(currentWorkspace.id, repoUrl, branchName);
      setStatus(`Cloned ${result.filesCloned} files`);
      await loadWorkspaceInternal(currentWorkspace.id);
      return true;
    } catch (e) {
      setStatus(`Clone failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setLoading(false);
      return false;
    }
  }, [currentWorkspace]);

  // Push to GitHub
  const pushToGitHub = useCallback(async (message: string) => {
    if (!currentWorkspace || !token) {
      setStatus('No workspace or GitHub token');
      return false;
    }

    const repoUrl = currentWorkspace.repoUrl || (currentRepo ? `https://github.com/${currentRepo}` : null);
    if (!repoUrl) {
      setStatus('No repository linked to workspace');
      return false;
    }

    setLoading(true);
    setStatus('Pushing to GitHub...');

    try {
      // Get all modified files
      const filesToPush = openFiles
        .filter(f => f.modified)
        .map(f => ({ path: f.path, content: f.content }));

      if (filesToPush.length === 0) {
        setStatus('No modified files to push');
        setLoading(false);
        return false;
      }

      const result = await studioAPI.pushToGitHub(
        currentWorkspace.id,
        repoUrl,
        filesToPush,
        message,
        token,
        branch
      );

      if (result.success) {
        // Mark files as not modified
        setOpenFiles(prev => prev.map(f => ({ ...f, modified: false, originalContent: f.content })));
        setStatus(`Pushed: ${result.commit?.slice(0, 7)}`);
        return true;
      } else {
        setStatus(`Push failed: ${result.message}`);
        return false;
      }
    } catch (e) {
      setStatus(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, token, currentRepo, branch, openFiles]);

  // Pull from GitHub
  const pullFromGitHub = useCallback(async () => {
    if (!currentWorkspace) {
      setStatus('No workspace loaded');
      return false;
    }

    const repoUrl = currentWorkspace.repoUrl || (currentRepo ? `https://github.com/${currentRepo}` : null);
    if (!repoUrl) {
      setStatus('No repository linked to workspace');
      return false;
    }

    setLoading(true);
    setStatus('Pulling from GitHub...');

    try {
      const result = await studioAPI.pullFromGitHub(
        currentWorkspace.id,
        repoUrl,
        token || undefined,
        branch
      );

      if (result.success) {
        setStatus(`Pulled ${result.filesUpdated} files`);
        await loadWorkspaceInternal(currentWorkspace.id);
        return true;
      } else {
        setStatus('Pull failed');
        return false;
      }
    } catch (e) {
      setStatus(`Pull failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, token, currentRepo, branch]);

  // Load GitHub repos
  const loadRepos = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/studio/repos', { headers: headers() });
      const data = await res.json();
      if (Array.isArray(data)) setRepos(data);
    } catch {
          // Non-critical operation — silent failure acceptable
        }
  }, [userId, headers]);

  // Load branches
  const loadBranches = useCallback(async () => {
    if (!token || !currentRepo) return;
    try {
      const res = await fetch(`/api/github/branches?repo=${currentRepo}`, {
        headers: { 'x-gh-token': token }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranches(data);
        if (!data.find(b => b.name === branch)) {
          setBranch(data[0]?.name || 'main');
        }
      }
    } catch {
          // Non-critical operation — silent failure acceptable
        }
  }, [token, currentRepo, branch]);

  // Load commits
  const loadCommits = useCallback(async () => {
    if (!token || !currentRepo) return;
    try {
      const res = await fetch(`/api/github/commits?repo=${currentRepo}&branch=${branch}`, {
        headers: { 'x-gh-token': token }
      });
      const data = await res.json();
      if (Array.isArray(data)) setCommits(data);
    } catch {
          // Non-critical operation — silent failure acceptable
        }
  }, [token, currentRepo, branch]);

  // Load files from GitHub (for initial sync)
  const loadFiles = useCallback(async () => {
    if (!token || !currentRepo) return;
    setLoading(true);
    setStatus('Loading files from GitHub...');
    try {
      const res = await fetch(`/api/github/tree?repo=${currentRepo}&ref=${branch}`, {
        headers: { 'x-gh-token': token }
      });
      const data = await res.json();
      const tree = buildTree((data.files || []).map((f: any) => ({ path: f.path, isDirectory: false })));
      setFileTree(tree);
      setStatus(`${data.files?.length || 0} files`);
    } catch (e) {
      setStatus('Error loading files');
    }
    setLoading(false);
  }, [token, currentRepo, branch, buildTree]);

  // Select repo
  const selectRepo = useCallback(async (repoFullName: string) => {
    setCurrentRepo(repoFullName);
    localStorage.setItem('studio_repo', repoFullName);
  }, []);

  // Add repo
  const addRepo = useCallback(async (repoFullName: string) => {
    if (!userId) return null;
    try {
      const res = await fetch('/api/studio/repos', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ repo_full_name: repoFullName })
      });
      const data = await res.json();
      if (data.id) {
        setCurrentRepoId(data.id);
        await loadRepos();
      }
      return data;
    } catch {
      return null;
    }
  }, [userId, headers, loadRepos]);

  // Sync to WebContainer
  const syncToWebContainer = useCallback(async () => {
    const flatFiles = Array.from(files.entries()).map(([path, content]) => ({ path, content }));
    if (flatFiles.length > 0) {
      await webcontainer.syncFiles(flatFiles);
    }
  }, [files, webcontainer]);

  // Cleanup
  useEffect(() => {
    return () => {
      terminalRef.current?.close();
    };
  }, []);

  return {
    // State - matches useStudio interface
    mounted,
    token,
    userId,
    repos,
    currentRepo,
    currentRepoId,
    branch,
    branches,
    fileTree,
    openFiles,
    activeFile,
    messages,
    commits,
    settings,
    status,
    loading,
    recentFiles,
    files: openFiles, // Alias for compatibility
    
    // Extended state
    workspaces,
    currentWorkspace,
    webcontainer,
    
    // Auth
    connect,
    disconnect,
    
    // Workspace
    loadWorkspace,
    createWorkspace,
    
    // Files - matches useStudio interface
    openFile,
    closeFile,
    updateFile,
    saveFile,
    revertFile,
    createFile,
    deleteFile,
    renameFile,
    loadFiles,
    
    // GitHub
    loadRepos,
    loadBranches,
    loadCommits,
    selectRepo,
    addRepo,
    cloneRepo,
    pushToGitHub,
    pullFromGitHub,
    
    // Terminal
    runCommand,
    
    // Sync
    syncToWebContainer,
    
    // Setters
    setActiveFile,
    setBranch,
    setSettings,
    setMessages,
    setCurrentRepo,
  };
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown',
    css: 'css', scss: 'scss',
    html: 'html', py: 'python',
    go: 'go', rs: 'rust',
    sql: 'sql', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', bash: 'shell',
  };
  return langMap[ext] || 'plaintext';
}
