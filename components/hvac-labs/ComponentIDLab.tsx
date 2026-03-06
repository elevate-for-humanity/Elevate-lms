'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, RotateCcw, ChevronRight, Zap } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  system: string;
  location: string;
  function: string;
  failureSymptoms: string[];
  testMethod: string;
  image?: string;
}

const COMPONENTS: Component[] = [
  {
    id: 'compressor',
    name: 'Compressor',
    system: 'Outdoor Unit (Condensing Unit)',
    location: 'Inside the outdoor unit, bolted to the base pan. Largest component — cylindrical or scroll-shaped.',
    function: 'Pumps refrigerant through the system. Compresses low-pressure vapor from the evaporator into high-pressure hot gas and pushes it to the condenser. The heart of the system.',
    failureSymptoms: ['System runs but does not cool', 'Loud buzzing or clicking at outdoor unit', 'Breaker trips repeatedly', 'High amp draw on clamp meter', 'Suction and discharge pressures equalize quickly after shutdown'],
    testMethod: 'Measure amp draw with clamp meter (compare to RLA on nameplate). Check winding resistance with ohmmeter: Common-to-Start + Common-to-Run should equal Start-to-Run. Megohm test for ground fault.',
  },
  {
    id: 'capacitor',
    name: 'Run Capacitor (Dual)',
    system: 'Outdoor Unit (Condensing Unit)',
    location: 'Inside the electrical panel of the outdoor unit. Silver or brown cylindrical can with 3 terminals on top labeled C (Common), HERM (Compressor), FAN.',
    function: 'Stores and releases electrical energy to help the compressor and condenser fan motor start and run efficiently. Without it, motors cannot start or run at full power.',
    failureSymptoms: ['Outdoor unit hums but does not start', 'Fan spins slowly or not at all', 'Compressor tries to start then shuts off on overload', 'Swollen or leaking capacitor (visual inspection)', 'System short-cycles'],
    testMethod: 'TURN OFF POWER. Discharge capacitor (short terminals with insulated screwdriver). Set multimeter to µF (microfarads). Read HERM-to-C (compressor side) and FAN-to-C (fan side). Compare to rating printed on capacitor. Within ±5% is acceptable. Outside ±10% = replace.',
  },
  {
    id: 'contactor',
    name: 'Contactor',
    system: 'Outdoor Unit (Condensing Unit)',
    location: 'Inside the electrical panel of the outdoor unit. Square or rectangular device with a coil and heavy-duty contacts. Line voltage comes in on top, load goes out on bottom.',
    function: 'An electrically controlled switch. When the thermostat calls for cooling, 24V energizes the contactor coil, pulling the contacts closed and sending 240V to the compressor and condenser fan motor.',
    failureSymptoms: ['Outdoor unit does not turn on at all', 'Buzzing sound from contactor but unit does not start', 'Pitted or burned contacts (visual inspection)', 'Intermittent operation — works sometimes, not others', 'Voltage on line side but not load side'],
    testMethod: 'Check for 24V at the coil terminals (from thermostat). If 24V present and contactor does not pull in, coil is bad. If it pulls in, check for voltage across the load contacts — should be near 0V when closed. Pitted contacts cause voltage drop.',
  },
  {
    id: 'condenser-fan',
    name: 'Condenser Fan Motor',
    system: 'Outdoor Unit (Condensing Unit)',
    location: 'Mounted at the top of the outdoor unit with the blade facing up. Pulls air through the condenser coil and exhausts it upward.',
    function: 'Moves outdoor air across the condenser coil to reject heat from the refrigerant. Without it, head pressure rises dangerously and the compressor overheats.',
    failureSymptoms: ['Fan does not spin but compressor runs', 'Fan spins slowly (bad capacitor or bearing)', 'Loud grinding or squealing noise', 'Discharge pressure extremely high', 'Compressor shuts off on high-pressure cutout'],
    testMethod: 'Check capacitor first (most common cause). Spin blade by hand — should spin freely. If stiff, bearings are bad. Check motor winding resistance with ohmmeter. Check amp draw against nameplate.',
  },
  {
    id: 'evaporator',
    name: 'Evaporator Coil',
    system: 'Indoor Unit (Air Handler / Furnace)',
    location: 'Mounted on top of the furnace or inside the air handler. A-coil or N-coil shape. Connected to the suction line (large) and liquid line (small).',
    function: 'Cold refrigerant flows through the coil and absorbs heat from indoor air blown across it by the blower. This is where the actual cooling happens. Air passes over the cold coil, gives up heat, and returns to the room cooler.',
    failureSymptoms: ['Frozen coil (ice buildup) — usually low airflow or low charge', 'Water leaking from unit (clogged condensate drain)', 'Poor cooling despite normal pressures (dirty coil restricting airflow)', 'Musty smell (mold on wet coil surface)'],
    testMethod: 'Visual inspection for ice, dirt, or damage. Measure temperature split (supply minus return should be 15-22°F). Check condensate drain for blockage. Clean with coil cleaner if dirty.',
  },
  {
    id: 'metering-device',
    name: 'Metering Device (TXV or Piston)',
    system: 'Indoor Unit (at evaporator inlet)',
    location: 'At the inlet of the evaporator coil where the liquid line connects. TXV has a sensing bulb clamped to the suction line. Piston (fixed orifice) is inside a brass fitting.',
    function: 'Drops the pressure of liquid refrigerant, creating a cold low-pressure mixture that enters the evaporator. Controls how much refrigerant flows into the evaporator. TXV adjusts automatically based on load. Piston is fixed.',
    failureSymptoms: ['TXV stuck closed: very low suction pressure, high superheat, high subcooling, poor cooling', 'TXV stuck open: low superheat, liquid flood-back to compressor', 'Piston restricted: same as TXV stuck closed', 'Frost on liquid line at the metering device = restriction'],
    testMethod: 'Calculate superheat and subcooling. TXV stuck closed = high superheat + high subcooling (charge is there but cannot get through). Check TXV sensing bulb — must be clamped tightly to suction line and insulated. Check screen for debris.',
  },
  {
    id: 'filter-drier',
    name: 'Filter-Drier',
    system: 'Liquid Line (between condenser and metering device)',
    location: 'In the liquid line, usually near the outdoor unit or at the indoor coil. Copper cylinder with an inlet and outlet.',
    function: 'Removes moisture and contaminants from the liquid refrigerant. The desiccant inside absorbs water. The filter screen catches particles. Prevents acid formation and metering device clogging.',
    failureSymptoms: ['Temperature drop across the drier (feel with your hand — inlet warm, outlet cold = restricted)', 'Frost or sweating on the drier body', 'Symptoms identical to a restricted metering device'],
    testMethod: 'Feel the temperature across the drier. Both sides should be the same temperature. If the outlet is noticeably colder, the drier is restricted and must be replaced. Always replace after a compressor burnout.',
  },
  {
    id: 'thermostat',
    name: 'Thermostat',
    system: 'Wall-mounted control',
    location: 'On an interior wall, approximately 5 feet high, away from direct sunlight, vents, and exterior doors.',
    function: 'The user interface. Senses room temperature and sends 24V signals to the equipment: Y = cooling, W = heating, G = fan, R = 24V power, C = common. Controls when the system turns on and off.',
    failureSymptoms: ['Blank screen (no power — check batteries or 24V from transformer)', 'System does not respond to setting changes', 'Short cycling (thermostat in bad location — near vent or sunlight)', 'Wrong wiring (heat runs when calling for cool)'],
    testMethod: 'Check for 24V between R and C at the thermostat. Jump R to Y at the thermostat — if outdoor unit starts, thermostat is bad. Check wire connections at both thermostat and air handler.',
  },
  {
    id: 'disconnect',
    name: 'Electrical Disconnect',
    system: 'Outdoor Unit (wall-mounted)',
    location: 'Mounted on the wall within sight of the outdoor unit. Contains a pull-out block or breaker.',
    function: 'Safety device that allows you to cut power to the outdoor unit before working on it. Required by code within sight of the equipment. Pull the block or flip the breaker to de-energize.',
    failureSymptoms: ['No power to outdoor unit (disconnect pulled or breaker tripped)', 'Burned or melted contacts inside disconnect (loose connections cause arcing)', 'Fuse blown (fused disconnect)'],
    testMethod: 'Check for voltage on the line side (should have 240V). Pull disconnect, check load side (should be 0V). If fused, check fuses with ohmmeter. Inspect for signs of arcing or overheating.',
  },
  {
    id: 'blower-motor',
    name: 'Blower Motor',
    system: 'Indoor Unit (Air Handler / Furnace)',
    location: 'Inside the air handler or furnace. Drives the blower wheel (squirrel cage) that moves air through the ductwork.',
    function: 'Moves conditioned air through the duct system to the rooms. Speed settings control airflow: higher speed for cooling, lower for heating. ECM (variable speed) motors adjust automatically.',
    failureSymptoms: ['No airflow from vents (motor not running)', 'Weak airflow (bad capacitor, dirty wheel, wrong speed setting)', 'Loud noise (bad bearings, loose wheel)', 'Frozen evaporator coil (blower not moving enough air)'],
    testMethod: 'Check capacitor first. Check for voltage at motor leads. Spin wheel by hand — should be free. Check amp draw. Measure static pressure to verify airflow. Clean blower wheel if caked with dirt.',
  },
];

export default function ComponentIDLab() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<'identify' | 'quiz' | 'results'>('identify');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Quiz: show a description, student picks the component name
  const quizQuestions = useMemo(() => {
    return COMPONENTS.map((c, i) => ({
      idx: i,
      prompt: c.function,
      correctAnswer: c.name,
      options: shuffle([c.name, ...getDistractors(c.name, COMPONENTS)]),
    })).sort(() => Math.random() - 0.5);
  }, []);

  const comp = COMPONENTS[currentIdx];

  if (phase === 'identify') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Component Identification</h3>
            <p className="text-sm text-slate-500">Learn every component in an HVAC system. Know what it does, where it is, and how to test it.</p>
          </div>
          <button
            onClick={() => setPhase('quiz')}
            className="bg-brand-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"
          >
            <Zap className="w-4 h-4" /> Take Quiz
          </button>
        </div>

        {/* Component Navigation */}
        <div className="flex gap-2 flex-wrap">
          {COMPONENTS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrentIdx(i)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                i === currentIdx ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Component Detail */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4">
            <h4 className="text-lg font-bold">{comp.name}</h4>
            <p className="text-sm text-slate-300">{comp.system}</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Where to Find It</h5>
              <p className="text-sm text-slate-700 leading-relaxed">{comp.location}</p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">What It Does</h5>
              <p className="text-sm text-slate-700 leading-relaxed">{comp.function}</p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Failure Symptoms</h5>
              <ul className="space-y-1.5">
                {comp.failureSymptoms.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
              <h5 className="text-xs font-bold text-brand-blue-700 uppercase mb-1">How to Test / Diagnose</h5>
              <p className="text-sm text-brand-blue-900">{comp.testMethod}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="text-sm font-medium text-slate-600 hover:text-slate-800 disabled:text-slate-300 transition"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-400">{currentIdx + 1} / {COMPONENTS.length}</span>
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(COMPONENTS.length - 1, prev + 1))}
            disabled={currentIdx === COMPONENTS.length - 1}
            className="text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800 disabled:text-slate-300 transition flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const correctCount = quizQuestions.filter((q) => quizAnswers[q.idx] === q.correctAnswer).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Component ID Quiz</h3>
          {!quizSubmitted && (
            <button onClick={() => { setPhase('identify'); setQuizAnswers({}); setQuizSubmitted(false); }} className="text-sm text-slate-500 hover:text-slate-700">
              Back to Study
            </button>
          )}
        </div>

        {quizSubmitted ? (
          <div className="space-y-4">
            <div className={`rounded-xl p-6 text-center ${correctCount >= 7 ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
              <p className="text-4xl font-black">{correctCount}/{quizQuestions.length}</p>
              <p className={`font-bold ${correctCount >= 7 ? 'text-green-700' : 'text-red-700'}`}>
                {correctCount >= 7 ? 'PASS' : 'Keep studying — you need to know every component'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPhase('identify'); setQuizAnswers({}); setQuizSubmitted(false); }} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg">
                <RotateCcw className="w-4 h-4 inline mr-2" /> Study Components
              </button>
              <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }} className="flex-1 bg-brand-blue-600 text-white font-bold py-3 rounded-lg">
                Retake Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Read the function description. Select the correct component.</p>
            {quizQuestions.map((q, qi) => (
              <div key={qi} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm text-slate-700 mb-3 leading-relaxed">{qi + 1}. &ldquo;{q.prompt}&rdquo;</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.idx]: opt }))}
                      className={`text-sm text-left p-3 rounded-lg border-2 transition ${
                        quizAnswers[q.idx] === opt
                          ? 'border-brand-blue-500 bg-brand-blue-50 font-medium'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setQuizSubmitted(true)}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-slate-300 transition"
            >
              Submit Quiz ({Object.keys(quizAnswers).length}/{quizQuestions.length} answered)
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Helpers
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDistractors(correct: string, all: Component[]): string[] {
  const others = all.filter((c) => c.name !== correct).map((c) => c.name);
  return shuffle(others).slice(0, 3);
}
