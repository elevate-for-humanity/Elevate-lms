'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Settings, 
  ChevronRight, 
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  Layers,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';

interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface Plan {
  id: string;
  slug: string;
  name: string;
  monthly_price: number;
  annual_price: number | null;
  limits: Record<string, any>;
  active: boolean;
  sort_order: number;
  features?: Feature[];
}

interface SubscriptionStats {
  total_plans: number;
  active_subscriptions: number;
  total_features: number;
  monthly_revenue: number;
}

export default function SubscriptionStudioPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'features' | 'limits' | 'preview'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [plansRes, featuresRes] = await Promise.all([
        fetch('/api/admin/subscriptions/plans'),
        fetch('/api/admin/subscriptions/features')
      ]);
      
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }
      
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatures(featuresData.features || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }

  async function togglePlanFeature(planId: string, featureId: string, enabled: boolean) {
    try {
      const res = await fetch('/api/admin/subscriptions/plans/features', {
        method: enabled ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, feature_id: featureId })
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
            <Link href="/admin/dev-studio" className="hover:text-white">
              Dev Studio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Subscription Configuration</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-red-600/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-brand-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Subscription Configuration Studio</h1>
                <p className="text-sm text-slate-400">Manage plans, features, and customer subscriptions</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'plans', label: 'Plans', icon: CreditCard },
              { id: 'features', label: 'Features', icon: Layers },
              { id: 'limits', label: 'Limits', icon: Settings },
              { id: 'preview', label: 'Preview', icon: Eye },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-red-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red-500" />
          </div>
        ) : (
          <>
            {activeTab === 'plans' && (
              <PlansTab 
                plans={plans} 
                features={features}
                onToggleFeature={togglePlanFeature}
                onEdit={(plan) => setEditingPlan(plan)}
              />
            )}
            {activeTab === 'features' && (
              <FeaturesTab features={features} />
            )}
            {activeTab === 'limits' && (
              <LimitsTab plans={plans} />
            )}
            {activeTab === 'preview' && (
              <PreviewTab plans={plans} features={features} />
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePlanModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function PlansTab({ plans, features, onToggleFeature, onEdit }: {
  plans: Plan[];
  features: Feature[];
  onToggleFeature: (planId: string, featureId: string, enabled: boolean) => void;
  onEdit: (plan: Plan) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          label="Total Plans" 
          value={plans.length.toString()} 
          icon={CreditCard}
        />
        <StatCard 
          label="Active Features" 
          value={features.length.toString()} 
          icon={Layers}
        />
        <StatCard 
          label="Monthly Revenue" 
          value={`$${plans.reduce((sum, p) => sum + p.monthly_price, 0)}`} 
          icon={DollarSign}
        />
        <StatCard 
          label="Avg. Price" 
          value={plans.length > 0 
            ? `$${Math.round(plans.reduce((sum, p) => sum + p.monthly_price, 0) / plans.length)}`
            : '$0'
          } 
          icon={Zap}
        />
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  plan.slug === 'enterprise' ? 'bg-purple-600/20' :
                  plan.slug === 'professional' ? 'bg-blue-600/20' :
                  'bg-slate-600/20'
                }`}>
                  <CreditCard className={`w-6 h-6 ${
                    plan.slug === 'enterprise' ? 'text-purple-400' :
                    plan.slug === 'professional' ? 'text-blue-400' :
                    'text-slate-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">
                    ${plan.monthly_price}/month · ${plan.annual_price || 0}/year
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  plan.active 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {plan.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => onEdit(plan)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Feature Grid */}
            <div className="p-6">
              <h4 className="text-sm font-medium text-slate-300 mb-4">Features</h4>
              <div className="grid grid-cols-3 gap-3">
                {features.map(feature => {
                  const hasFeature = plan.features?.some(f => f.id === feature.id);
                  return (
                    <button
                      key={feature.id}
                      onClick={() => onToggleFeature(plan.id, feature.id, !hasFeature)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        hasFeature
                          ? 'bg-green-600/10 border-green-600/30 text-green-400'
                          : 'bg-slate-700/50 border-slate-600/30 text-slate-400'
                      }`}
                    >
                      {hasFeature ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span className="text-sm">{feature.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesTab({ features }: { features: Feature[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Feature Catalog</h2>
          <p className="text-sm text-slate-400">
            {features.length} features available for assignment to plans
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>

      <div className="grid gap-4">
        {features.map(feature => (
          <div key={feature.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">{feature.name}</h3>
                <p className="text-sm text-slate-400">{feature.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitsTab({ plans }: { plans: Plan[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Plan Limits</h2>
        <p className="text-sm text-slate-400">
          Configure user, storage, and feature limits per plan
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Locations</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Automation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Custom Branding</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <span className="font-medium text-white">{plan.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {plan.limits?.users || 1}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {plan.limits?.locations || 1}
                </td>
                <td className="px-6 py-4">
                  {plan.limits?.automation ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-slate-500" />
                  )}
                </td>
                <td className="px-6 py-4">
                  {plan.limits?.custom_branding ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-slate-500" />
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewTab({ plans, features }: { plans: Plan[]; features: Feature[] }) {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || '');

  const currentPlan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Plan Preview</h2>
        <p className="text-sm text-slate-400">
          See how plans appear to customers
        </p>
      </div>

      {/* Plan Selector */}
      <div className="flex gap-4">
        {plans.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPlan === plan.id
                ? 'bg-brand-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      {/* Preview Card */}
      {currentPlan && (
        <div className="bg-white rounded-2xl overflow-hidden max-w-2xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">{currentPlan.name}</h3>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-4xl font-bold text-white">${currentPlan.monthly_price}</span>
              <span className="text-slate-400">/month</span>
            </div>
            <p className="text-slate-300 text-sm">
              Billed {currentPlan.annual_price ? 'annually' : 'monthly'}
            </p>
          </div>
          
          <div className="p-8">
            <h4 className="font-semibold text-slate-900 mb-4">Included Features:</h4>
            <div className="space-y-3">
              {features.map(feature => {
                const hasFeature = currentPlan.features?.some(f => f.id === feature.id);
                return (
                  <div key={feature.id} className="flex items-center gap-3">
                    {hasFeature ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300" />
                    )}
                    <span className={hasFeature ? 'text-slate-900' : 'text-slate-400'}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-8 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold rounded-lg">
              Choose {currentPlan.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CreatePlanModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    monthly_price: 0,
    annual_price: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create New Plan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Monthly Price
              </label>
              <input
                type="number"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Annual Price
              </label>
              <input
                type="number"
                value={formData.annual_price}
                onChange={(e) => setFormData({ ...formData, annual_price: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg"
            >
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
