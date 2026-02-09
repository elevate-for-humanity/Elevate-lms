'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  CheckCircle,
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
  DollarSign,
  Percent
} from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applies_to: string;
}

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_purchase: 0,
    max_uses: '',
    valid_until: '',
    applies_to: 'career_courses',
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      setPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: editingCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingCode?.id,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          valid_until: formData.valid_until || null,
        }),
      });

      if (res.ok) {
        fetchPromoCodes();
        setShowForm(false);
        setEditingCode(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving promo code:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' });
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      await fetch('/api/admin/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
      });
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: '',
      valid_until: '',
      applies_to: 'career_courses',
    });
  };

  const startEdit = (promo: PromoCode) => {
    setEditingCode(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_purchase: promo.min_purchase || 0,
      max_uses: promo.max_uses?.toString() || '',
      valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : '',
      applies_to: promo.applies_to || 'career_courses',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Promo Codes" }]} />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Promo Codes" }]} />
        </div>
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Promo Codes</h1>
                <p className="text-sm text-gray-600">Manage discount codes for courses</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingCode(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Code
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Codes</p>
            <p className="text-2xl font-bold">{promoCodes.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {promoCodes.filter(p => p.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Uses</p>
            <p className="text-2xl font-bold">
              {promoCodes.reduce((acc, p) => acc + (p.current_uses || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Expired</p>
            <p className="text-2xl font-bold text-gray-400">
              {promoCodes.filter(p => p.valid_until && new Date(p.valid_until) < new Date()).length}
            </p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border rounded-lg uppercase"
                    placeholder="SAVE20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="20% off all courses"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Type</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg"
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Uses (optional)</label>
                    <input
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expires (optional)</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Applies To</label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="all">All Products</option>
                    <option value="career_courses">Career Courses Only</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCode(null);
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCode ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Promo Codes Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Code</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Discount</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Uses</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Expires</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No promo codes yet. Create your first one!
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => {
                  const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
                  const isMaxedOut = promo.max_uses && promo.current_uses >= promo.max_uses;

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                            {promo.code}
                          </code>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedCode === promo.code ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {promo.description && (
                          <p className="text-sm text-gray-500 mt-1">{promo.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1">
                          {promo.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-blue-600" />
                              {promo.discount_value}% off
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-green-600" />
                              ${promo.discount_value} off
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          {promo.current_uses || 0}
                          {promo.max_uses && ` / ${promo.max_uses}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {promo.valid_until ? (
                          <span className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            {new Date(promo.valid_until).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Expired</span>
                        ) : isMaxedOut ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Maxed Out</span>
                        ) : promo.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(promo)}
                            className={`px-3 py-1 text-sm rounded ${
                              promo.is_active 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {promo.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => startEdit(promo)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
