import React, { type CSSProperties } from 'react';
import type { TeachingVisual } from '../../lib/ultimate-course-builder/instructional/teaching-visual';
import { teachingPresentation } from '../../lib/ultimate-course-builder/instructional/teaching-presentation';

/** These are authored instructional displays, never footage-derived claims of
 * an actual approval, real student record, or physical procedure. */
export function BlueprintTeachingGraphic({ plan, seconds, duration, color }: {
  plan: TeachingVisual; seconds: number; duration: number; color: string;
}) {
  const state = teachingPresentation(plan, seconds, duration);
  const card: CSSProperties = {
    background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '24px 28px',
    fontFamily: 'sans-serif', color: '#0f172a', border: `4px solid ${color}`,
    overflowWrap: 'anywhere',
  };
  const rowStyle = (active: boolean): CSSProperties => ({
    border: `4px solid ${active ? color : '#cbd5e1'}`, borderRadius: 12,
    padding: '18px 22px', background: active ? '#f1f5f9' : '#fff',
  });
  const label: CSSProperties = { fontSize: 64, fontWeight: 900, lineHeight: 1.15 };
  const value: CSSProperties = { fontSize: 64, lineHeight: 1.2, marginTop: 10 };
  const rows = state.rows;
  return <div style={card} data-teaching-kind={state.kind} data-teaching-step={state.activeIndex}>
    {state.kind === 'record' ? (
      <dl style={{ display: 'grid', gap: 14, margin: 0 }}>
        {rows.map(row => <div key={row.index} style={{ ...rowStyle(row.active), display: 'grid', gridTemplateColumns: '35% 1fr', gap: 24 }}>
          <dt style={label}>{row.label}</dt><dd style={{ ...value, margin: 0 }}>{row.value}</dd>
        </div>)}
      </dl>
    ) : state.kind === 'choices' ? (
      <ul style={{ display: 'grid', gap: 14, margin: 0, padding: 0, listStyle: 'none' }}>
        {rows.map(row => <li key={row.index} style={rowStyle(row.active)}>
          <div style={label}>{row.label}</div><div style={value}>{row.value}</div>
        </li>)}
      </ul>
    ) : state.kind === 'comparison' ? (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, 1fr)`, gap: 18 }}>
        {rows.map(row => <section key={row.index} style={rowStyle(row.active)}>
          <div style={label}>{row.label}</div><div style={value}>{row.value}</div>
        </section>)}
      </div>
    ) : state.kind === 'terms' ? (
      <dl style={{ display: 'grid', gap: 14, margin: 0 }}>
        {rows.map(row => <div key={row.index} style={rowStyle(row.active)}>
          <dt style={{ ...label, color }}>{row.label}</dt><dd style={{ ...value, marginLeft: 0 }}>{row.value}</dd>
        </div>)}
      </dl>
    ) : (
      <ol start={state.activeIndex + 1} style={{ margin: 0, paddingLeft: 90 }}>
        {rows.map(row => <li key={row.index} style={{ ...rowStyle(row.active), ...label }}>
          <div style={label}>{row.label}</div><div style={{ ...value, fontWeight: 500 }}>{row.value}</div>
        </li>)}
      </ol>
    )}
    <div style={{ marginTop: 20, height: 12, background: '#e2e8f0', borderRadius: 8 }}>
      <div style={{ height: '100%', width: `${((state.activeIndex + 1) / plan.steps.length) * 100}%`, background: color, borderRadius: 8 }} />
    </div>
  </div>;
}
