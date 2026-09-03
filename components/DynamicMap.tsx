'use client';

/**
 * DynamicMap
 * 
 * Dynamic map component for employer locations and workforce networks.
 * Reuses existing WorkOneIndianaMap and BarberWorkforceNetworkMap.
 * 
 * Usage:
 *   <DynamicMap type="employer-locations" employerId="123" />
 *   <DynamicMap type="workforce-network" />
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic imports for existing map components
const WorkOneIndianaMapComponent = dynamic(
  () => import('@/components/workone/WorkOneIndianaMap').then((m) => m.WorkOneIndianaMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    ),
  }
);

const BarberWorkforceNetworkMapComponent = dynamic(
  () => import('@/components/programs/beauty/BarberWorkforceNetworkMap').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface DynamicMapProps {
  type: 'employer-locations' | 'workforce-network' | 'workone';
  region?: string;
  className?: string;
}

export function DynamicMap({ type, region, className = '' }: DynamicMapProps) {
  switch (type) {
    case 'workforce-network':
      return <BarberWorkforceNetworkMapComponent />;
    
    case 'workone':
      return <WorkOneIndianaMapComponent />;
    
    case 'employer-locations':
      // For employer-specific locations, use WorkOne as the base
      return <WorkOneIndianaMapComponent />;
    
    default:
      return (
        <div className={`h-96 bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
          <p className="text-slate-500">Map type not supported</p>
        </div>
      );
  }
}

// Default export for dynamic import compatibility
export default DynamicMap;