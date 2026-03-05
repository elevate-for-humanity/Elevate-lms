'use client';

import { useState } from 'react';

interface WireInfo {
  terminal: string;
  color: string;
  wireColor: string;
  function: string;
  description: string;
  connects: string;
  voltage: string;
}

const WIRES: WireInfo[] = [
  {
    terminal: 'R',
    color: '#dc2626',
    wireColor: 'Red',
    function: '24V Power',
    description:
      'The power wire. Carries 24 volts from the transformer to the thermostat. This is the source of power for the entire control circuit. Some systems split this into Rh (heating) and Rc (cooling).',
    connects: 'Transformer secondary (24V side)',
    voltage: '24V AC',
  },
  {
    terminal: 'C',
    color: '#1e40af',
    wireColor: 'Blue',
    function: 'Common (Return)',
    description:
      'The common wire completes the 24V circuit back to the transformer. Required for smart thermostats and any thermostat that needs constant power. Without C, the thermostat has no return path for continuous power.',
    connects: 'Transformer common terminal',
    voltage: '0V (return path)',
  },
  {
    terminal: 'Y',
    color: '#eab308',
    wireColor: 'Yellow',
    function: 'Cooling',
    description:
      'When the thermostat calls for cooling, it connects R to Y, sending 24V to the contactor coil in the outdoor condenser unit. This starts the compressor and condenser fan.',
    connects: 'Contactor coil in outdoor unit',
    voltage: '24V when cooling',
  },
  {
    terminal: 'G',
    color: '#16a34a',
    wireColor: 'Green',
    function: 'Fan',
    description:
      'Controls the indoor blower fan. When energized, the blower runs regardless of heating or cooling demand. In AUTO mode, the system controls the fan. In ON mode, G is always energized.',
    connects: 'Fan relay on the control board',
    voltage: '24V when fan runs',
  },
  {
    terminal: 'W',
    color: '#f8fafc',
    wireColor: 'White',
    function: 'Heating',
    description:
      'When the thermostat calls for heat, it connects R to W, sending 24V to the gas valve (gas furnace) or heat relay (electric heat). This starts the heating cycle.',
    connects: 'Gas valve or heat relay',
    voltage: '24V when heating',
  },
  {
    terminal: 'O/B',
    color: '#f97316',
    wireColor: 'Orange',
    function: 'Reversing Valve (Heat Pump)',
    description:
      'Controls the reversing valve in heat pump systems. O energizes in cooling mode (Carrier, Honeywell). B energizes in heating mode (Rheem, Ruud). This wire switches the heat pump between heating and cooling.',
    connects: 'Reversing valve solenoid',
    voltage: '24V (mode-dependent)',
  },
];

interface Props {
  mode?: 'explore' | 'quiz' | 'review';
  onWireSelect?: (terminal: string) => void;
}

export default function ThermostatWiringDiagram({ mode = 'explore', onWireSelect }: Props) {
  const [activeWire, setActiveWire] = useState<string | null>(null);
  const [revealedWires, setRevealedWires] = useState<Set<string>>(new Set());

  const handleClick = (terminal: string) => {
    setActiveWire(terminal);
    if (mode === 'quiz') {
      setRevealedWires((prev) => new Set(prev).add(terminal));
    }
    onWireSelect?.(terminal);
  };

  const isRevealed = (terminal: string) =>
    mode === 'review' || mode === 'explore' || revealedWires.has(terminal);

  const active = WIRES.find((w) => w.terminal === activeWire);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">Thermostat Wiring Diagram</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'quiz'
            ? 'Click each terminal to identify its function'
            : 'Click any terminal to learn what that wire does'}
        </p>
      </div>

      <div className="p-4 md:p-6">
        <svg viewBox="0 0 700 380" className="w-full max-w-2xl mx-auto" role="img" aria-label="Thermostat wiring diagram showing R, C, Y, G, W, and O/B terminals">
          {/* Thermostat body */}
          <rect x="220" y="30" width="260" height="180" rx="20" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
          <text x="350" y="55" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="700">THERMOSTAT</text>
          <rect x="280" y="65" width="140" height="50" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <text x="350" y="95" textAnchor="middle" fill="#475569" fontSize="18" fontWeight="700">72°F</text>

          {/* Terminal strip */}
          <rect x="250" y="130" width="200" height="60" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="350" y="148" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">TERMINAL STRIP</text>

          {/* Terminal blocks */}
          {WIRES.map((wire, i) => {
            const x = 270 + i * 30;
            const isActive = activeWire === wire.terminal;
            return (
              <g key={wire.terminal} onClick={() => handleClick(wire.terminal)} className="cursor-pointer" role="button" aria-label={`Terminal ${wire.terminal}: ${wire.function}`}>
                {/* Terminal screw */}
                <circle
                  cx={x}
                  cy={170}
                  r={10}
                  fill={isActive ? wire.color : '#f8fafc'}
                  stroke={wire.color}
                  strokeWidth={isActive ? 3 : 2}
                />
                <text
                  x={x}
                  y={174}
                  textAnchor="middle"
                  fill={isActive ? '#fff' : wire.terminal === 'W' ? '#334155' : wire.color}
                  fontSize="10"
                  fontWeight="700"
                >
                  {isRevealed(wire.terminal) ? wire.terminal : '?'}
                </text>

                {/* Wire going down */}
                <line
                  x1={x}
                  y1={180}
                  x2={x}
                  y2={250}
                  stroke={wire.color}
                  strokeWidth={isActive ? 3 : 2}
                  strokeDasharray={wire.terminal === 'W' ? '0' : '0'}
                />

                {/* Wire color dot */}
                <circle cx={x} cy={240} r={5} fill={wire.color} stroke={wire.terminal === 'W' ? '#94a3b8' : 'none'} strokeWidth="1" />

                {/* Active pulse */}
                {isActive && (
                  <circle cx={x} cy={170} r={14} fill="none" stroke={wire.color} strokeWidth="1.5" opacity="0.4">
                    <animate attributeName="r" from="14" to="20" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Equipment connections */}
          {/* Transformer */}
          <rect x="50" y="260" width="120" height="50" rx="8" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
          <text x="110" y="282" textAnchor="middle" fill="#991b1b" fontSize="10" fontWeight="600">TRANSFORMER</text>
          <text x="110" y="298" textAnchor="middle" fill="#991b1b" fontSize="9">240V → 24V</text>
          {/* R wire to transformer */}
          <path d="M270,250 L270,285 L170,285" fill="none" stroke="#dc2626" strokeWidth="2" />
          {/* C wire to transformer */}
          <path d="M300,250 L300,300 L170,300" fill="none" stroke="#1e40af" strokeWidth="2" />

          {/* Outdoor unit */}
          <rect x="530" y="260" width="140" height="50" rx="8" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.5" />
          <text x="600" y="282" textAnchor="middle" fill="#9a3412" fontSize="10" fontWeight="600">OUTDOOR UNIT</text>
          <text x="600" y="298" textAnchor="middle" fill="#9a3412" fontSize="9">Contactor / Compressor</text>
          {/* Y wire to outdoor */}
          <path d="M330,250 L330,275 L530,275" fill="none" stroke="#eab308" strokeWidth="2" />

          {/* Indoor unit */}
          <rect x="290" y="320" width="140" height="50" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
          <text x="360" y="342" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="600">AIR HANDLER</text>
          <text x="360" y="358" textAnchor="middle" fill="#166534" fontSize="9">Blower / Gas Valve</text>
          {/* G wire to air handler */}
          <path d="M360,250 L360,320" fill="none" stroke="#16a34a" strokeWidth="2" />
          {/* W wire to air handler */}
          <path d="M390,250 L390,310 L380,310 L380,320" fill="none" stroke="#94a3b8" strokeWidth="2" />

          {/* Heat pump reversing valve */}
          <rect x="530" y="320" width="140" height="50" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
          <text x="600" y="342" textAnchor="middle" fill="#9a3412" fontSize="10" fontWeight="600">REVERSING VALVE</text>
          <text x="600" y="358" textAnchor="middle" fill="#9a3412" fontSize="9">Heat Pump Only</text>
          {/* O/B wire */}
          <path d="M420,250 L420,345 L530,345" fill="none" stroke="#f97316" strokeWidth="2" />

          {/* Wire color legend */}
          <text x="50" y="240" fill="#64748b" fontSize="9" fontWeight="600">WIRE COLORS:</text>
          {WIRES.map((w, i) => (
            <g key={w.terminal}>
              <circle cx={60 + i * 28} cy={252} r={4} fill={w.color} stroke={w.terminal === 'W' ? '#94a3b8' : 'none'} strokeWidth="1" />
              <text x={60 + i * 28} y={256} textAnchor="middle" fill="#475569" fontSize="7" fontWeight="600">
                {w.wireColor.charAt(0)}
              </text>
            </g>
          ))}
        </svg>

        {/* Detail panel */}
        {active && (
          <div
            className="mt-4 rounded-lg p-5 border-l-4 bg-slate-50"
            style={{ borderColor: active.color }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: active.color, border: active.terminal === 'W' ? '2px solid #94a3b8' : 'none', color: active.terminal === 'W' ? '#334155' : '#fff' }}
              >
                {active.terminal}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{active.function}</h4>
                <p className="text-xs text-slate-500">{active.wireColor} wire · {active.voltage}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mt-3">{active.description}</p>
            <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Connects To</p>
              <p className="text-sm text-slate-700">{active.connects}</p>
            </div>
          </div>
        )}

        {!active && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Click any terminal on the thermostat to learn what that wire controls.
          </p>
        )}

        {/* Quiz progress */}
        {mode === 'quiz' && (
          <div className="mt-4 flex items-center gap-2 justify-center">
            {WIRES.map((w) => (
              <div
                key={w.terminal}
                className="flex items-center gap-1"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    revealedWires.has(w.terminal)
                      ? 'text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  style={revealedWires.has(w.terminal) ? { backgroundColor: w.color, color: w.terminal === 'W' ? '#334155' : '#fff' } : {}}
                >
                  {revealedWires.has(w.terminal) ? w.terminal : '?'}
                </div>
              </div>
            ))}
            <span className="text-xs text-slate-500 ml-2">
              {revealedWires.size}/{WIRES.length} terminals identified
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
