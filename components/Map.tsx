'use client';

import React from 'react';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title?: string;
    popup?: string;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

export default function Map({ className = '', style }: MapProps) {
  return (
    <div
      className={`map-container ${className}`}
      style={{
        ...style,
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.5rem',
        minHeight: '256px',
        ...style,
      }}
    >
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: '0 auto', marginBottom: '8px' }}
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <p style={{ margin: 0, fontSize: '14px' }}>Map Component</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
          Configure map provider for production
        </p>
      </div>
    </div>
  );
}
