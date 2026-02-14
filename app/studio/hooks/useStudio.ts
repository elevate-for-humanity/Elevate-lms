'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FileNode, OpenFile, Branch, Commit, Settings, Repo, Message } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  autoSave: false,
};

export function useStudio() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [currentRepo, setCurrentRepo] = useState('');
  const [currentRepoId, setCurrentRepoId] = useState('');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<{ file_path: string; accessed_at: string }[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('studio_token');
    const savedUserId = localStorage.getItem('studio_user_id');
    const savedRepo = localStorage.getItem('studio_repo');
    const savedSettings = localStorage.getItem('studio_settings');
    
    if (savedToken) setToken(savedToken);
    if (savedUserId) setUserId(savedUserId);
    if (savedRepo) setCurrentRepo(savedRepo);
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch {
      // Non-critical operation — silent failure acceptable
    }
    }
    setMounted(true);
  }, []);

  // Save settings to localStorage
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

  // Validate and save token
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
    localStorage.removeItem('studio_repo');
    setToken('');
    setUserId('');
    setCurrentRepo('');
    setFileTree([]);
    setOpenFiles([]);
    setBranches([]);
    setMessages([]);
  }, []);

  // Load user's repos from database
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

  // Add a repo
  const addRepo = useCallback(async (repoFullName: string) => {
    if (!userId) return;
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

  // Select a repo
  const selectRepo = useCallback(async (repoFullName: string) => {
    setCurrentRepo(repoFullName);
    localStorage.setItem('studio_repo', repoFullName);
    
    // Find or create repo in database
    const existing = repos.find(r => r.repo_full_name === repoFullName);
    if (existing) {
      setCurrentRepoId(existing.id);
    } else {
      const added = await addRepo(repoFullName);
      if (added?.id) setCurrentRepoId(added.id);
    }
  }, [repos, addRepo]);

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

  // Build tree from flat file list
  const buildTree = useCallback((files: { path: string; sha: string }[]): FileNode[] => {
    const root: FileNode[] = [];
    const map: Record<string, FileNode> = {};

    files
      .filter(f => !f.path.includes('node_modules') && !f.path.includes('.next') && !f.path.includes('.git'))
      .forEach(f => {
        const parts = f.path.split('/');
        let current = root;
        let currentPath = '';

        parts.forEach((part, i) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const isFile = i === parts.length - 1;

          if (!map[currentPath]) {
            const node: FileNode = {
              path: currentPath,
              sha: isFile ? f.sha : '',
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

  // Load file tree
  const loadFiles = useCallback(async () => {
    if (!token || !currentRepo) return;
    setLoading(true);
    setStatus('Loading files...');
    try {
      const res = await fetch(`/api/github/tree?repo=${currentRepo}&ref=${branch}`, {
        headers: { 'x-gh-token': token }
      });
      const data = await res.json();
      const tree = buildTree(data.files || []);
      setFileTree(tree);
      setStatus(`${data.files?.length || 0} files`);
    } catch (e) {
      setStatus('Error loading files');
    }
    setLoading(false);
  }, [token, currentRepo, branch, buildTree]);

  // Open a file
  const openFile = useCallback(async (path: string) => {
    const existing = openFiles.find(f => f.path === path);
    if (existing) {
      setActiveFile(path);
      return;
    }

    setStatus(`Opening ${path}...`);
    try {
      const res = await fetch(
        `/api/github/file?repo=${currentRepo}&path=${encodeURIComponent(path)}&ref=${branch}`,
        { headers: { 'x-gh-token': token } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setOpenFiles(prev => [...prev, {
        path,
        content: data.content,
        originalContent: data.content,
        sha: data.sha,
        language: data.language || 'plaintext',
        modified: false
      }]);
      setActiveFile(path);
      setStatus('');

      // Track in recent files
      if (currentRepoId) {
        fetch('/api/studio/recent', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ repo_id: currentRepoId, file_path: path, branch })
        }).catch(() => {});
      }
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  }, [openFiles, currentRepo, branch, token, currentRepoId, headers]);

  // Close a file
  const closeFile = useCallback((path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (file?.modified && !confirm('Discard unsaved changes?')) return;
    
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setActiveFile(remaining[remaining.length - 1]?.path || '');
    }
  }, [openFiles, activeFile]);

  // Update file content
  const updateFile = useCallback((path: string, content: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, content, modified: content !== f.originalContent } : f
    ));
  }, []);

  // Save file with commit message
  const saveFile = useCallback(async (path: string, commitMessage?: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file) return false;

    const message = commitMessage || `Update ${path}`;
    setStatus(`Saving ${path}...`);
    
    try {
      const res = await fetch('/api/github/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({
          repo: currentRepo,
          path,
          content: file.content,
          sha: file.sha,
          branch,
          message
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);

      setOpenFiles(prev => prev.map(f =>
        f.path === path ? { ...f, sha: data.content.sha, originalContent: f.content, modified: false } : f
      ));
      setStatus(`Saved: ${data.commit.slice(0, 7)}`);
      return true;
    } catch (e) {
      setStatus(`Save failed: ${e}`);
      return false;
    }
  }, [openFiles, currentRepo, branch, token]);

  // Revert file to original
  const revertFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, content: f.originalContent, modified: false } : f
    ));
  }, []);

  // Create new file
  const createFile = useCallback(async (path: string, content = '') => {
    setStatus(`Creating ${path}...`);
    try {
      const res = await fetch('/api/github/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({
          repo: currentRepo,
          path,
          content,
          branch,
          message: `Create ${path}`
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);

      await loadFiles();
      await openFile(path);
      setStatus('Created');
      return true;
    } catch (e) {
      setStatus(`Create failed: ${e}`);
      return false;
    }
  }, [currentRepo, branch, token, loadFiles, openFile]);

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file) {
      // Need to fetch SHA first
      const res = await fetch(
        `/api/github/file?repo=${currentRepo}&path=${encodeURIComponent(path)}&ref=${branch}`,
        { headers: { 'x-gh-token': token } }
      );
      const data = await res.json();
      if (!data.sha) return false;
      file.sha = data.sha;
    }

    if (!confirm(`Delete ${path}?`)) return false;

    setStatus(`Deleting ${path}...`);
    try {
      const res = await fetch('/api/github/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({
          repo: currentRepo,
          path,
          sha: file.sha,
          branch,
          message: `Delete ${path}`
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);

      closeFile(path);
      await loadFiles();
      setStatus('Deleted');
      return true;
    } catch (e) {
      setStatus(`Delete failed: ${e}`);
      return false;
    }
  }, [openFiles, currentRepo, branch, token, closeFile, loadFiles]);

  // Rename/move file
  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    setStatus(`Renaming ${oldPath}...`);
    try {
      const res = await fetch('/api/github/file', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({
          repo: currentRepo,
          old_path: oldPath,
          new_path: newPath,
          branch,
          message: `Rename ${oldPath} to ${newPath}`
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);

      // Update open files
      setOpenFiles(prev => prev.map(f =>
        f.path === oldPath ? { ...f, path: newPath, sha: data.content.sha } : f
      ));
      if (activeFile === oldPath) setActiveFile(newPath);
      
      await loadFiles();
      setStatus('Renamed');
      return true;
    } catch (e) {
      setStatus(`Rename failed: ${e}`);
      return false;
    }
  }, [currentRepo, branch, token, activeFile, loadFiles]);

  // Duplicate file
  const duplicateFile = useCallback(async (path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file) {
      // Fetch content first
      const res = await fetch(
        `/api/github/file?repo=${currentRepo}&path=${encodeURIComponent(path)}&ref=${branch}`,
        { headers: { 'x-gh-token': token } }
      );
      const data = await res.json();
      if (!data.content) return false;
      
      const ext = path.includes('.') ? '.' + path.split('.').pop() : '';
      const base = path.replace(ext, '');
      const newPath = `${base}-copy${ext}`;
      return createFile(newPath, data.content);
    }
    
    const ext = path.includes('.') ? '.' + path.split('.').pop() : '';
    const base = path.replace(ext, '');
    const newPath = `${base}-copy${ext}`;
    return createFile(newPath, file.content);
  }, [openFiles, currentRepo, branch, token, createFile]);

  // Download file
  const downloadFile = useCallback((path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file) return;
    
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [openFiles]);

  // Upload file (create from content)
  const uploadFile = useCallback(async (path: string, content: string) => {
    return createFile(path, content);
  }, [createFile]);

  // Create branch
  const createBranch = useCallback(async (name: string, from?: string) => {
    setStatus(`Creating branch ${name}...`);
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({
          repo: currentRepo,
          name,
          from: from || branch
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);

      await loadBranches();
      setBranch(name);
      setStatus(`Branch created: ${name}`);
      return true;
    } catch (e) {
      setStatus(`Branch creation failed: ${e}`);
      return false;
    }
  }, [currentRepo, branch, token, loadBranches]);

  // Load commit history
  const loadHistory = useCallback(async (filePath?: string) => {
    if (!token || !currentRepo) return;
    try {
      let url = `/api/github/history?repo=${currentRepo}&branch=${branch}`;
      if (filePath) url += `&path=${encodeURIComponent(filePath)}`;
      
      const res = await fetch(url, { headers: { 'x-gh-token': token } });
      const data = await res.json();
      setCommits(data.commits || []);
    } catch {
      // Non-critical operation — silent failure acceptable
    }
  }, [token, currentRepo, branch]);

  // View file at specific commit
  const viewFileAtCommit = useCallback(async (sha: string, path: string) => {
    setStatus(`Loading ${path} at ${sha.slice(0, 7)}...`);
    try {
      const res = await fetch(
        `/api/github/file?repo=${currentRepo}&path=${encodeURIComponent(path)}&ref=${sha}`,
        { headers: { 'x-gh-token': token } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Open as read-only with commit SHA in name
      const viewPath = `${path} @ ${sha.slice(0, 7)}`;
      setOpenFiles(prev => [...prev.filter(f => f.path !== viewPath), {
        path: viewPath,
        content: data.content,
        originalContent: data.content,
        sha: data.sha,
        language: data.language || 'plaintext',
        modified: false
      }]);
      setActiveFile(viewPath);
      setStatus('');
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  }, [currentRepo, token]);

  // Load recent files
  const loadRecentFiles = useCallback(async () => {
    if (!userId || !currentRepoId) return;
    try {
      const res = await fetch(`/api/studio/recent?repo_id=${currentRepoId}&limit=10`, {
        headers: headers()
      });
      const data = await res.json();
      if (Array.isArray(data)) setRecentFiles(data);
    } catch {
      // Non-critical operation — silent failure acceptable
    }
  }, [userId, currentRepoId, headers]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Pull latest changes from remote
  const pullChanges = useCallback(async () => {
    if (!token || !currentRepo) return null;
    setStatus('Pulling latest changes...');
    setLoading(true);
    
    try {
      const res = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gh-token': token },
        body: JSON.stringify({ repo: currentRepo, branch }),
      });
      const data = await res.json();
      
      if (data.ok) {
        // Refresh files to get latest
        await loadFiles();
        await loadHistory();
        
        // Refresh any open files that changed
        if (data.filesChanged?.length > 0) {
          const changedPaths = data.filesChanged.map((f: any) => f.filename);
          for (const file of openFiles) {
            if (changedPaths.includes(file.path) && !file.modified) {
              // Re-fetch the file content
              const fileRes = await fetch(
                `/api/github/file?repo=${currentRepo}&path=${encodeURIComponent(file.path)}&ref=${branch}`,
                { headers: { 'x-gh-token': token } }
              );
              const fileData = await fileRes.json();
              if (!fileData.error) {
                setOpenFiles(prev => prev.map(f =>
                  f.path === file.path
                    ? { ...f, content: fileData.content, originalContent: fileData.content, sha: fileData.sha }
                    : f
                ));
              }
            }
          }
        }
        
        setStatus(`Pulled: ${data.latestCommit?.message?.split('\n')[0] || data.latestSha?.slice(0, 7)}`);
        return data;
      } else {
        setStatus(`Pull failed: ${data.error}`);
        return null;
      }
    } catch (e) {
      setStatus(`Pull failed: ${e}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentRepo, branch, openFiles, loadFiles, loadHistory]);

  // Load on repo/branch change
  useEffect(() => {
    if (token && currentRepo) {
      loadBranches();
      loadFiles();
      loadHistory();
      loadRecentFiles();
    }
  }, [token, currentRepo, branch]);

  // Load repos on userId change
  useEffect(() => {
    if (userId) loadRepos();
  }, [userId, loadRepos]);

  return {
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
    
    connect,
    disconnect,
    selectRepo,
    addRepo,
    setBranch,
    loadFiles,
    openFile,
    closeFile,
    updateFile,
    saveFile,
    revertFile,
    createFile,
    deleteFile,
    renameFile,
    createBranch,
    loadHistory,
    setActiveFile,
    setMessages,
    setStatus,
    updateSettings,
    duplicateFile,
    downloadFile,
    uploadFile,
    recentFiles,
    loadRecentFiles,
    viewFileAtCommit,
    pullChanges,
    files: fileTree,
    
    // AI fix errors
    fixErrors: async (path: string, errorMessage: string) => {
      const file = openFiles.find(f => f.path === path);
      if (!file) return false;
      
      setStatus('AI fixing errors...');
      try {
        const res = await fetch('/api/studio/fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: file.content,
            error: errorMessage,
            language: file.language,
            filename: file.path,
          }),
        });
        const data = await res.json();
        if (data.fixedCode) {
          setOpenFiles(prev => prev.map(f =>
            f.path === path ? { ...f, content: data.fixedCode, modified: true } : f
          ));
          setStatus('Fixed!');
          return true;
        }
      } catch (e) {
        setStatus(`Fix failed: ${e}`);
      }
      return false;
    },

    // Generate tests
    generateTests: async (path: string) => {
      const file = openFiles.find(f => f.path === path);
      if (!file) return null;
      
      setStatus('Generating tests...');
      try {
        const res = await fetch('/api/studio/generate-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: file.content,
            language: file.language,
            filename: file.path,
          }),
        });
        const data = await res.json();
        if (data.tests) {
          // Create the test file
          await createFile(data.testFilename, data.tests);
          setStatus(`Tests generated: ${data.testFilename}`);
          return data.testFilename;
        }
      } catch (e) {
        setStatus(`Generate tests failed: ${e}`);
      }
      return null;
    },
  };
}
