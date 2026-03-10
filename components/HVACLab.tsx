'use client';

/**
 * HVACLab — interactive component identification exercise.
 * 3D version requires @react-three/fiber which is not installed.
 * This is a 2D fallback using a labeled diagram image.
 */

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const COMPONENTS = [
  { id: 'compressor', label: 'Compressor', desc: 'Pressurizes the refrigerant gas' },
  { id: 'condenser', label: 'Condenser Coil', desc: 'Releases heat to the outside air' },
  { id: 'expansion', label: 'Expansion Valve', desc: 'Reduces refrigerant pressure and temperature' },
  { id: 'evaporator', label: 'Evaporator Coil', desc: 'Absorbs heat from indoor air' },
  { id: 'refrigerant', label: 'Refrigerant Lines', desc: 'Carry refrigerant between components' },
];

interface HVACLabProps {
  onAllIdentified?: () => void;
}

export default function HVACLab({ onAllIdentified }: HVACLabProps) {
  const [identified, setIdentified] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setIdentified(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (next.size === COMPONENTS.length) onAllIdentified?.();
      return next;
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <h3 className="text-white font-bold text-lg mb-2">HVAC System Component Lab</h3>
      <p className="text-slate-400 text-sm mb-6">Click each component to identify it. Identify all 5 to complete the lab.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COMPONENTS.map(c => {
          const done = identified.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${done ? 'border-brand-green-500 bg-brand-green-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {done && <CheckCircle className="w-4 h-4 text-brand-green-400 flex-shrink-0" />}
                <span className={`font-bold text-sm ${done ? 'text-brand-green-300' : 'text-white'}`}>{c.label}</span>
              </div>
              <p className="text-slate-400 text-xs">{c.desc}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-center text-slate-500 text-sm">
        {identified.size} / {COMPONENTS.length} identified
        {identified.size === COMPONENTS.length && (
          <span className="ml-2 text-brand-green-400 font-bold">✓ Lab Complete!</span>
        )}
      </div>
    </div>
  );
}
