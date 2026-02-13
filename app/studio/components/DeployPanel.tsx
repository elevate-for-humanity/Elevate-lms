'use client';

import { useState, useEffect, useCallback } from 'react';

interface Deployment {
  id: string;
  provider: string;
  repo: string;
  branch: string;
  deployment_id: string;
  url: string | null;
  status: string;
  created_at: string;
}

interface SavedToken {
  id: string;
  provider: string;
  project_id: string | null;
  hasToken: boolean;
}

interface DeployPanelProps {
  repo: string;
  branch: string;
  userId: string;
}

export function DeployPanel({ repo, branch, userId }: DeployPanelProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [provider, setProvider] = useState<'netlify'>('netlify');
  const [tokenInput, setTokenInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved tokens from database
  const loadSavedTokens = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/studio/deploy-tokens', {
        headers: { 'x-user-id': userId },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedTokens(data);
        // Set project ID if saved
        const current = data.find((t: SavedToken) => t.provider === provider);
        if (current?.project_id) {
          setProjectId(current.project_id);
        }
      }
    } catch (e) {
      console.error('Failed to load saved tokens:', e);
    }
  }, [userId, provider]);

  // Save token to database
  const saveToken = async () => {
    if (!tokenInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/studio/deploy-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          provider,
          token: tokenInput,
          project_id: projectId || null,
        }),
      });
      const data = await res.json();
      if (data.hasToken) {
        await loadSavedTokens();
        setTokenInput('');
        setShowConfig(false);
      }
    } catch (e) {
      console.error('Failed to save token:', e);
    }
    setSaving(false);
  };

  // Delete saved token
  const deleteToken = async (prov: string) => {
    if (!confirm(`Delete ${prov} token?`)) return;
    try {
      await fetch(`/api/studio/deploy-tokens?provider=${prov}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      await loadSavedTokens();
    } catch (e) {
      console.error('Failed to delete token:', e);
    }
  };

  const loadDeployments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/studio/deploy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ repo }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setDeployments(data);
    } catch (e) {
      console.error('Failed to load deployments:', e);
    }
    setLoading(false);
  }, [repo, userId]);

  const deploy = async () => {
    // Check if we have a saved token
    const hasSavedToken = savedTokens.some(t => t.provider === provider && t.hasToken);
    
    if (!hasSavedToken && !tokenInput.trim()) {
      setShowConfig(true);
      return;
    }

    setDeploying(true);
    try {
      // Get token from database if saved
      let token = tokenInput;
      if (hasSavedToken && !tokenInput) {
        const tokenRes = await fetch('/api/studio/deploy-tokens', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ provider }),
        });
        const tokenData = await tokenRes.json();
        token = tokenData.token;
        if (tokenData.project_id && !projectId) {
          setProjectId(tokenData.project_id);
        }
      }

      const res = await fetch('/api/studio/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          provider,
          repo,
          branch,
          project_id: projectId || undefined,
          token,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadDeployments();
      } else {
        alert(data.error || 'Deployment failed');
      }
    } catch (e) {
      console.error('Deploy failed:', e);
    }
    setDeploying(false);
  };

  const checkStatus = async (deployment: Deployment) => {
    try {
      // Get token for status check
      const tokenRes = await fetch('/api/studio/deploy-tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ provider: deployment.provider }),
      });
      const tokenData = await tokenRes.json();

      const res = await fetch(
        `/api/studio/deploy?provider=${deployment.provider}&id=${deployment.deployment_id}`,
        { 
          headers: { 
            'x-user-id': userId,
            'x-deploy-token': tokenData.token || '',
          } 
        }
      );
      const data = await res.json();
      if (data.status) {
        setDeployments(prev =>
          prev.map(d =>
            d.id === deployment.id ? { ...d, status: data.status, url: data.url || d.url } : d
          )
        );
      }
    } catch (e) {
      console.error('Failed to check status:', e);
    }
  };

  useEffect(() => {
    loadDeployments();
    loadSavedTokens();
  }, [loadDeployments, loadSavedTokens]);

  // Auto-refresh pending deployments
  useEffect(() => {
    const pending = deployments.filter(d => 
      d.status === 'pending' || d.status === 'building' || d.status === 'queued'
    );
    if (pending.length > 0) {
      const interval = setInterval(() => {
        pending.forEach(d => checkStatus(d));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [deployments]);

  // Update project ID when provider changes
  useEffect(() => {
    const current = savedTokens.find(t => t.provider === provider);
    setProjectId(current?.project_id || '');
  }, [provider, savedTokens]);

  const hasToken = (prov: string) => savedTokens.some(t => t.provider === prov && t.hasToken);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'success':
        return '#7ee787';
      case 'error':
      case 'failed':
        return '#f85149';
      case 'building':
      case 'pending':
      case 'queued':
        return '#e2c08d';
      default:
        return '#888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
      case 'success':
        return '✅';
      case 'error':
      case 'failed':
        return '❌';
      case 'building':
      case 'pending':
      case 'queued':
        return '🔄';
      default:
        return '⚪';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: 12, borderBottom: '1px solid #3c3c3c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Deploy</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              padding: '4px 8px',
              background: '#3c3c3c',
              border: 'none',
              borderRadius: 4,
              color: '#888',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            ⚙
          </button>
        </div>

        {/* Provider selection */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setProvider('netlify')}
            style={{
              flex: 1,
              padding: 8,
              background: provider === 'netlify' ? '#00ad9f' : '#3c3c3c',
              border: provider === 'netlify' ? '1px solid #00ad9f' : '1px solid transparent',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            ◆ Netlify
            {hasToken('netlify') && <span style={{ color: '#7ee787', fontSize: 10 }}>✓</span>}
          </button>
        </div>

        {/* Config */}
        {showConfig && (
          <div style={{ marginBottom: 12, padding: 12, background: '#1e1e1e', borderRadius: 4 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>
                Netlify Token
                {hasToken(provider) && <span style={{ color: '#7ee787', marginLeft: 8 }}>Saved ✓</span>}
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder={hasToken(provider) ? '••••••••' : 'Enter token...'}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>
                Project ID (optional)
              </label>
              <input
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="Project ID or name..."
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={saveToken}
                disabled={saving || !tokenInput.trim()}
                style={{
                  padding: '6px 12px',
                  background: '#238636',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  opacity: tokenInput.trim() ? 1 : 0.5,
                }}
              >
                {saving ? 'Saving...' : 'Save Token'}
              </button>
              {hasToken(provider) && (
                <button
                  onClick={() => deleteToken(provider)}
                  style={{
                    padding: '6px 12px',
                    background: '#da3633',
                    border: 'none',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Deploy button */}
        <button
          onClick={deploy}
          disabled={deploying}
          style={{
            width: '100%',
            padding: 12,
            background: deploying ? '#3c3c3c' : '#00ad9f',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: deploying ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {deploying ? 'Deploying...' : 'Deploy to Netlify'}
        </button>
        <div style={{ fontSize: 11, color: '#888', marginTop: 8, textAlign: 'center' }}>
          {branch} branch
          {!hasToken(provider) && (
            <span style={{ color: '#e2c08d', marginLeft: 8 }}>• Token required</span>
          )}
        </div>
      </div>

      {/* Deployments list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && deployments.length === 0 ? (
          <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>Loading...</div>
        ) : deployments.length === 0 ? (
          <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>No deployments yet</div>
        ) : (
          deployments.map(d => (
            <div
              key={d.id}
              style={{
                padding: 12,
                borderBottom: '1px solid #3c3c3c',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{getStatusIcon(d.status)}</span>
                <span style={{ 
                  fontWeight: 500, 
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}>
                  {d.provider}
                </span>
                <span style={{ 
                  color: getStatusColor(d.status), 
                  fontSize: 11,
                  marginLeft: 'auto',
                }}>
                  {d.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                {d.branch} • {new Date(d.created_at).toLocaleString()}
              </div>
              {d.url && (
                <a
                  href={d.url.startsWith('http') ? d.url : `https://${d.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#58a6ff' }}
                >
                  {d.url}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
