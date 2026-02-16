"use client";

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

import React, { useState, useEffect } from 'react';
import { frameworkSettings } from '../lib/frameworkSettings';

export function FrameworkSettingsPanel() {
  const [config] = useState(frameworkSettings.getConfig());
  const [validation, setValidation] = useState(
    frameworkSettings.validateFrameworkCompatibility()
  );
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    setValidation(frameworkSettings.validateFrameworkCompatibility());
  }, [config]);

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'build', label: 'Build', icon: '🔨' },
    { id: 'frontend', label: 'Frontend', icon: '⚛️' },
    { id: 'styling', label: 'Styling', icon: '🎨' },
    { id: 'testing', label: 'Testing', icon: '🧪' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'ecosystem', label: 'Ecosystem', icon: '🌐' },
  ];

  const renderOverview = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(au minmax(280px, 1fr))',
        gap: 20,
      }}
    >
      <div
        style={{
          padding: 20,
          border: '1px solid var(--brand-border)',
          borderRadius: 12,
          background: 'var(--brand-surface)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
          🏗️ Framework Stack
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li>⚛️ React {config.frontend.version}</li>
          <li>
            🔷 TypeScript {config.typescript.enabled ? '5.9.2' : 'Disabled'}
          </li>
          <li>⚡ Vite (Build Tool)</li>
          <li>🎨 Tailwind CSS {config.styling.version}</li>
          <li>🧪 {config.testing.framework}</li>
        </ul>
      </div>
      <div
        style={{
          padding: 20,
          border: '1px solid var(--brand-border)',
          borderRadius: 12,
          background: validation.isValid ? '#f0fdf4' : '#fef2f2',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: validation.isValid ? '#166534' : 'var(--brand-danger)',
          }}
        >
          {validation.isValid
            ? '• Configuration Valid'
            : '❌ Configuration Issues'}
        </h3>
        {validation.errors.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--brand-danger)' }}>Errors:</strong>
            <ul
              style={{
                margin: '4px 0',
                paddingLeft: 20,
                color: 'var(--brand-danger)',
              }}
            >
              {validation.errors.map((error, i) => (
                <li key={i} style={{ fontSize: '0.875rem' }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div>
            <strong style={{ color: 'var(--brand-warning)' }}>Warnings:</strong>
            <ul
              style={{
                margin: '4px 0',
                paddingLeft: 20,
                color: 'var(--brand-warning)',
              }}
            >
              {validation.warnings.map((warning, i) => (
                <li key={i} style={{ fontSize: '0.875rem' }}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        style={{
          padding: 20,
          border: '1px solid var(--brand-border)',
          borderRadius: 12,
          background: 'var(--brand-surface)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>🌐 Ecosystem</h3>
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '0.875rem',
            color: 'var(--brand-text-muted)',
          }}
        >
          Multi-site: {config.ecosystem.multiSite ? 'Enabled' : 'Disabled'}
        </p>
        {config.ecosystem.sisterSites && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {config.ecosystem.sisterSites.map((site, i) => (
              <li
                key={i}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--brand-text-muted)',
                  marginBottom: 4,
                }}
              >
                🔗 {site.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderConfigSection = (sectionKey: string) => {
    const sectionConfig = config[sectionKey as keyof typeof config];
    if (!sectionConfig) return <div>Configuration not found</div>;

    return (
      <div>
        <h3 style={{ marginTop: 0, textTransform: 'capitalize' }}>
          {sectionKey} Configuration
        </h3>
        <pre
          style={{
            background: 'var(--brand-surface)',
            border: '1px solid var(--brand-border)',
            borderRadius: 8,
            padding: 16,
            overflow: 'auto',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(sectionConfig, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Framework Configuration</h2>
        <p
          style={{
            margin: 0,
            color: 'var(--brand-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          Manage your application framework settings and view system
          configuration
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--brand-border)',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background:
                activeSection === section.id
                  ? 'var(--brand-info)'
                  : 'transparent',
              color:
                activeSection === section.id
                  ? 'white'
                  : 'var(--brand-text-muted)',
              cursor: 'pointer',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: activeSection === section.id ? '600' : '400',
              transition: 'all 0.2s ease',
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>
      <div>
        {activeSection === 'overview'
          ? renderOverview()
          : renderConfigSection(activeSection)}
      </div>
      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--brand-surface)',
          border: '1px solid var(--brand-border)',
          borderRadius: 8,
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
          Configuration Info
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--brand-text-muted)',
          }}
        >
          Last updated: {config.meta.lastUpdated} | Version:{' '}
          {config.meta.version}
        </p>
      </div>
    </div>
  );
}

export default FrameworkSettingsPanel;
