'use client';

import { useState } from 'react';
import { User, Copy, Check, X, ChevronDown } from 'lucide-react';
import { DEMO_USERS } from '@/lib/demo/context';

interface DemoRoleSwitcherProps {
  currentRole?: DemoRole;
  isDemoTenant?: boolean;
}

export function DemoRoleSwitcher({ currentRole, isDemoTenant = true }: DemoRoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  
  // Only show in demo tenant
  if (!isDemoTenant) return null;
  
  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const roles = Object.entries(DEMO_USERS) as [DemoRole, typeof DEMO_USERS[DemoRole]][];
  
  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-200 transition"
      >
        <User className="w-4 h-4" />
        <span>Demo Role</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Switch Demo Role</div>
                  <div className="text-xs text-slate-500">Copy credentials to sign in as different role</div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Role List */}
            <div className="p-2">
              {roles.map(([roleKey, user]) => {
                const isCurrentRole = currentRole === roleKey;
                const isCopied = copiedEmail === user.email;
                
                return (
                  <div
                    key={roleKey}
                    className={`p-3 rounded-lg ${isCurrentRole ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'} transition`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{user.name}</span>
                          {isCurrentRole && (
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{user.description}</div>
                        <div className="text-xs text-slate-400 mt-1 font-mono truncate">{user.email}</div>
                      </div>
                      
                      <button
                        onClick={() => handleCopyEmail(user.email)}
                        className={`flex-shrink-0 p-2 rounded-lg transition ${
                          isCopied 
                            ? 'bg-brand-green-100 text-brand-green-600' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={isCopied ? 'Copied!' : 'Copy email'}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Demo password: <code className="bg-slate-200 px-1.5 py-0.5 rounded">demo123</code>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Open an incognito window to sign in as a different role simultaneously.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
