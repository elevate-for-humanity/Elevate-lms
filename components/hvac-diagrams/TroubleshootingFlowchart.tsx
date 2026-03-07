'use client';

import { useState } from 'react';

interface FlowNode {
  id: string;
  type: 'start' | 'decision' | 'action' | 'result';
  text: string;
  detail: string;
  yes?: string;
  no?: string;
  next?: string;
}

const NO_COOL_FLOW: FlowNode[] = [
  {
    id: 'start',
    type: 'start',
    text: 'Customer Complaint: System Not Cooling',
    detail: 'The customer reports the AC is running but not cooling, or not running at all. Begin systematic diagnosis.',
    next: 'check-thermostat',
  },
  {
    id: 'check-thermostat',
    type: 'decision',
    text: 'Is the thermostat set to COOL and below room temp?',
    detail: 'Check thermostat mode (COOL, not HEAT or OFF), fan setting (AUTO), and setpoint is below current room temperature. Also verify the display is powered on.',
    yes: 'check-power',
    no: 'fix-thermostat',
  },
  {
    id: 'fix-thermostat',
    type: 'result',
    text: 'Adjust thermostat settings',
    detail: 'Set mode to COOL, fan to AUTO, and setpoint 3°F below room temperature. Wait 5 minutes for the system to respond. If the thermostat display is blank, check batteries or 24V power.',
  },
  {
    id: 'check-power',
    type: 'decision',
    text: 'Is the outdoor unit receiving power?',
    detail: 'Check the disconnect at the outdoor unit — is it pulled or switched off? Check the breaker panel — is the AC breaker tripped? Measure 240V at the disconnect with a multimeter.',
    yes: 'check-contactor',
    no: 'fix-power',
  },
  {
    id: 'fix-power',
    type: 'result',
    text: 'Restore power to outdoor unit',
    detail: 'Reset the breaker or close the disconnect. If the breaker trips again immediately, there is a short circuit — do not keep resetting. Check for grounded compressor windings or shorted wiring.',
  },
  {
    id: 'check-contactor',
    type: 'decision',
    text: 'Is the contactor pulling in (closing)?',
    detail: 'With the thermostat calling for cooling, measure 24V across the contactor coil terminals. If 24V is present, the coil should pull the contacts closed. Listen for a click.',
    yes: 'check-capacitor',
    no: 'fix-contactor',
  },
  {
    id: 'fix-contactor',
    type: 'result',
    text: 'Diagnose contactor / control circuit',
    detail: 'If no 24V at the coil: check thermostat wiring, safety switches, and transformer. If 24V is present but contactor does not pull in: the coil is open — replace the contactor.',
  },
  {
    id: 'check-capacitor',
    type: 'decision',
    text: 'Is the compressor starting and running?',
    detail: 'With the contactor closed, the compressor should start within a few seconds. If it hums but does not start, or starts then trips on overload, suspect a bad capacitor or compressor.',
    yes: 'check-airflow',
    no: 'fix-capacitor',
  },
  {
    id: 'fix-capacitor',
    type: 'result',
    text: 'Test capacitor and compressor',
    detail: 'Measure the run capacitor — must be within ±6% of rated µF. If weak or failed, replace it. If the capacitor is good but the compressor still won\'t start, check compressor windings (C-S, C-R, S-R) and test for grounded windings.',
  },
  {
    id: 'check-airflow',
    type: 'decision',
    text: 'Is there adequate airflow at the supply registers?',
    detail: 'Check the air filter — is it dirty? Is the blower running? Measure temperature at the supply register. If the blower is running but airflow is weak, the filter or evaporator coil may be restricted.',
    yes: 'check-refrigerant',
    no: 'fix-airflow',
  },
  {
    id: 'fix-airflow',
    type: 'result',
    text: 'Restore airflow',
    detail: 'Replace dirty filter. Check blower motor operation and speed setting. Inspect evaporator coil for ice or dirt. Check ductwork for disconnections or crushed flex duct. Verify return air path is not blocked.',
  },
  {
    id: 'check-refrigerant',
    type: 'decision',
    text: 'Are refrigerant pressures normal?',
    detail: 'Connect manifold gauges. For R-410A: suction should be ~118-150 psig, discharge ~350-450 psig at typical conditions. Calculate superheat and subcooling. Compare to manufacturer specs.',
    yes: 'system-ok',
    no: 'fix-refrigerant',
  },
  {
    id: 'fix-refrigerant',
    type: 'result',
    text: 'Diagnose refrigerant issue',
    detail: 'Low suction + low subcooling = undercharge (leak). High suction + high subcooling = overcharge. High suction + low subcooling = compressor weakness. Normal suction + high subcooling = liquid line restriction. Perform leak detection if undercharged.',
  },
  {
    id: 'system-ok',
    type: 'result',
    text: 'System operating normally',
    detail: 'If pressures, airflow, and temperatures are all within spec, the system is working correctly. Check for duct leaks, insulation issues, or an undersized system if the customer still has comfort complaints.',
  },
];

interface Props {
  mode?: 'explore' | 'guided' | 'quiz' | 'review';
  onComplete?: () => void;
}

export default function TroubleshootingFlowchart({ mode = 'explore', onComplete }: Props) {
  const [activeNodeId, setActiveNodeId] = useState<string>('start');
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set(['start']));

  const activeNode = NO_COOL_FLOW.find((n) => n.id === activeNodeId);

  const goTo = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setVisitedNodes((prev) => {
      const next = new Set(prev).add(nodeId);
      // Fire onComplete when student reaches any result node
      const targetNode = NO_COOL_FLOW.find((n) => n.id === nodeId);
      if (targetNode?.type === 'result') onComplete?.();
      return next;
    });
  };

  const nodeColor = (node: FlowNode) => {
    switch (node.type) {
      case 'start': return { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' };
      case 'decision': return { bg: '#fefce8', border: '#ca8a04', text: '#854d0e' };
      case 'action': return { bg: '#f0fdf4', border: '#16a34a', text: '#166534' };
      case 'result': return { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">HVAC Troubleshooting Flowchart</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Follow the diagnostic steps a technician uses to find the problem
        </p>
      </div>

      <div className="p-4 md:p-6">
        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {NO_COOL_FLOW.filter((n) => visitedNodes.has(n.id)).map((node) => {
            const colors = nodeColor(node);
            return (
              <button
                key={node.id}
                onClick={() => goTo(node.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  node.id === activeNodeId ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  ...(node.id === activeNodeId ? { ringColor: colors.border } : {}),
                }}
              >
                {node.type === 'decision' ? '◇' : node.type === 'result' ? '■' : '●'}{' '}
                {node.text.length > 30 ? node.text.slice(0, 30) + '…' : node.text}
              </button>
            );
          })}
        </div>

        {/* Active node */}
        {activeNode && (() => {
          const colors = nodeColor(activeNode);
          return (
            <div
              className="rounded-xl p-6 border-2"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            >
              {/* Node type badge */}
              <span
                className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                style={{ backgroundColor: colors.border, color: '#fff' }}
              >
                {activeNode.type === 'decision' ? 'Check' : activeNode.type === 'result' ? 'Action / Result' : activeNode.type}
              </span>

              <h4 className="font-bold text-lg mt-3" style={{ color: colors.text }}>
                {activeNode.text}
              </h4>

              <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                {activeNode.detail}
              </p>

              {/* Decision buttons */}
              {activeNode.type === 'decision' && (
                <div className="flex gap-3 mt-5">
                  {activeNode.yes && (
                    <button
                      onClick={() => goTo(activeNode.yes!)}
                      className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      ✓ YES — Continue
                    </button>
                  )}
                  {activeNode.no && (
                    <button
                      onClick={() => goTo(activeNode.no!)}
                      className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      ✗ NO — Found Problem
                    </button>
                  )}
                </div>
              )}

              {/* Next button for non-decision nodes */}
              {activeNode.next && (
                <button
                  onClick={() => goTo(activeNode.next!)}
                  className="mt-5 w-full py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition text-sm"
                >
                  Begin Diagnosis →
                </button>
              )}

              {/* Result — restart option */}
              {activeNode.type === 'result' && (
                <button
                  onClick={() => { setActiveNodeId('start'); setVisitedNodes(new Set(['start'])); }}
                  className="mt-5 w-full py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition text-sm"
                >
                  ↺ Start Over
                </button>
              )}
            </div>
          );
        })()}

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>{visitedNodes.size} of {NO_COOL_FLOW.length} steps visited</span>
          <span>
            {NO_COOL_FLOW.filter((n) => n.type === 'result' && visitedNodes.has(n.id)).length} diagnosis paths explored
          </span>
        </div>
      </div>
    </div>
  );
}
