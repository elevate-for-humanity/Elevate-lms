'use client';

import { useState, useEffect } from 'react';

interface Deployment {
  id: string;
  copilot_type: string;
  status: 'deploying' | 'active' | 'stopped' | 'failed';
  config: Record<string, unknown>;
  deployed_at: string;
}

interface DeploymentOption {
  id: string;
  type: 'ai_tutor' | 'admin_assistant' | 'support_bot';
  name: string;
  description: string;
  features: string[];
}

const deploymentOptions: DeploymentOption[] = [
  {
    id: 'tutor',
    type: 'ai_tutor',
    name: 'AI Tutor',
    description: 'Personalized learning assistance for students',
    features: ['24/7 availability', 'Multi-language support', 'Course-specific knowledge']
  },
  {
    id: 'assistant',
    type: 'admin_assistant',
    name: 'Admin Assistant',
    description: 'Help with administrative tasks and reporting',
    features: ['Report generation', 'Data analysis', 'Task automation']
  },
  {
    id: 'support',
    type: 'support_bot',
    name: 'Support Bot',
    description: 'Automated support for common inquiries',
    features: ['FAQ handling', 'Ticket routing', 'Self-service support']
  }
];

export default function DeployClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [config, setConfig] = useState({
    apiKey: '',
    model: 'gpt-4',
    enableLogging: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const res = await fetch('/api/admin/copilot/deploy');
      const data = await res.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeploymentStatus = (type: string): Deployment | undefined => {
    return deployments.find(d => d.copilot_type === type && (d.status === 'active' || d.status === 'deploying'));
  };

  const handleDeploy = async (option: DeploymentOption) => {
    if (!config.apiKey) {
      setMessage({ type: 'error', text: 'Please enter an API key before deploying' });
      return;
    }

    setDeploying(option.type);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/copilot/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copilot_type: option.type,
          config: {
            model: config.model,
            enableLogging: config.enableLogging,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setMessage({ type: 'success', text: `${option.name} deployment initiated!` });
      
      // Refresh deployments after a delay to get updated status
      setTimeout(fetchDeployments, 2500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Deployment failed' });
    } finally {
      setDeploying(null);
    }
  };

  const handleToggle = async (deployment: Deployment) => {
    const action = deployment.status === 'active' ? 'stop' : 'start';
    
    try {
      const res = await fetch('/api/admin/copilot/deploy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_id: deployment.id,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setMessage({ type: 'success', text: data.message });
      fetchDeployments();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Action failed' });
    }
  };

  const handleRemove = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to remove this deployment?')) return;

    try {
      const res = await fetch(`/api/admin/copilot/deploy?id=${deploymentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Removal failed');
      }

      setMessage({ type: 'success', text: 'Deployment removed' });
      fetchDeployments();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Removal failed' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Deployment Options */}
      {deploymentOptions.map((option) => {
        const deployment = getDeploymentStatus(option.type);
        const isDeploying = deploying === option.type;
        
        return (
          <div key={option.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{option.name}</h3>
                    {deployment && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        deployment.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : deployment.status === 'deploying'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {deployment.status === 'active' ? 'Active' : deployment.status === 'deploying' ? 'Deploying...' : 'Stopped'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{option.description}</p>
                  <ul className="mt-3 space-y-1">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                {deployment ? (
                  <>
                    <button 
                      onClick={() => handleToggle(deployment)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        deployment.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {deployment.status === 'active' ? 'Stop' : 'Start'}
                    </button>
                    <button 
                      onClick={() => handleRemove(deployment.id)}
                      className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleDeploy(option)}
                    disabled={isDeploying}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isDeploying
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                    }`}
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Deployment Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input 
              type="password" 
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter your OpenAI API key"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Required for AI features</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Selection
            </label>
            <select 
              className="w-full border rounded-lg px-3 py-2"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            >
              <option value="gpt-4">GPT-4 (Recommended)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="logging" 
              className="w-4 h-4 rounded"
              checked={config.enableLogging}
              onChange={(e) => setConfig({ ...config, enableLogging: e.target.checked })}
            />
            <label htmlFor="logging" className="text-sm text-gray-700">
              Enable conversation logging for quality improvement
            </label>
          </div>
        </div>
      </div>

      {/* Active Deployments Summary */}
      {deployments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Deployment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Deployed At</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="py-2 px-3 capitalize">{d.copilot_type.replace('_', ' ')}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        d.status === 'active' ? 'bg-green-100 text-green-700' :
                        d.status === 'stopped' ? 'bg-gray-100 text-gray-600' :
                        d.status === 'deploying' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{new Date(d.deployed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
