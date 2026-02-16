'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, AlertCircle } from 'lucide-react';

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function EligibilityModal({ isOpen, onClose, onContinue }: EligibilityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Eligibility Required</h2>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-4">
            Most programs require approval through <strong>WorkOne / Indiana Career Connect</strong>.
          </p>

          <p className="text-gray-700 font-medium mb-3">Before applying, confirm you:</p>
          
          <ul className="space-y-2 mb-4">
            {[
              'Are 18+',
              'Live in Indiana',
              'Are authorized to work in the U.S.',
              'Are seeking employment or higher wages',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <span className="text-slate-400 flex-shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
            Final eligibility is determined by WorkOne / Indiana Career Connect.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onContinue}
              className="w-full bg-brand-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Continue to Apply
            </button>
            <Link
              href="/check-eligibility"
              className="w-full text-center border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
              onClick={onClose}
            >
              Check Full Eligibility Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
export function useEligibilityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const openModal = (onContinue: () => void) => {
    setPendingAction(() => onContinue);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setPendingAction(null);
  };

  const handleContinue = () => {
    if (pendingAction) {
      pendingAction();
    }
    closeModal();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    handleContinue,
    Modal: () => (
      <EligibilityModal
        isOpen={isOpen}
        onClose={closeModal}
        onContinue={handleContinue}
      />
    ),
  };
}

// Wrapper component for Apply buttons
interface EligibilityGatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function EligibilityGatedLink({ href, children, className }: EligibilityGatedLinkProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleContinue = () => {
    window.location.href = href;
  };

  return (
    <>
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
      <EligibilityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onContinue={handleContinue}
      />
    </>
  );
}
