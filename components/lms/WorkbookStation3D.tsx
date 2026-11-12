'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';

export type StationVariant = 'barber' | 'cosmetology' | 'esthetics' | 'nail';

type Point = { id: string; label: string; description: string; position: [number, number, number] };

const SKIN = '#c98f6b';
const STATIONS: Record<StationVariant, { title: string; points: Point[] }> = {
  barber: {
    title: '3D barber mannequin',
    points: [
      {
        id: 'crown',
        label: 'Crown',
        description:
          'Highest back point of the head. Hair often grows in a whorl here, so check growth direction before cutting.',
        position: [0, 1.02, -0.35],
      },
      {
        id: 'parietal',
        label: 'Parietal ridge',
        description:
          'Widest part of the head. A high fade transitions near this line; a low fade stays well below it.',
        position: [0.62, 0.55, 0],
      },
      {
        id: 'nape',
        label: 'Nape',
        description:
          'Lowest hairline at the back of the neck. Low fades start their shortest length here and blend upward.',
        position: [0, -0.2, -0.55],
      },
      {
        id: 'sideburn',
        label: 'Sideburn and ear outline',
        description:
          'Fold the ear forward and outline with light, controlled strokes. Confirm length with the client first.',
        position: [0.68, 0.05, 0.12],
      },
      {
        id: 'clipper',
        label: 'Clipper and guard',
        description:
          'Higher numbered guards leave more length. Confirm the guard is seated and disinfected before every service.',
        position: [1.25, 0.2, 0.3],
      },
    ],
  },
  cosmetology: {
    title: '3D cosmetology styling station',
    points: [
      {
        id: 'sections',
        label: 'Top sections',
        description:
          'Divide clean, combed hair into controlled sections and clip the parts you are not working on.',
        position: [0, 1.05, 0.1],
      },
      {
        id: 'nape',
        label: 'Nape section',
        description:
          'Many haircuts and colour applications start at the nape, where hair is usually shortest and most resistant.',
        position: [0, -0.15, -0.55],
      },
      {
        id: 'product',
        label: 'Product bottle',
        description:
          'Read the manufacturer directions and safety data sheet. Complete any required patch or strand test first.',
        position: [-1.2, 0.05, 0.3],
      },
      {
        id: 'thermal',
        label: 'Thermal tool',
        description:
          'Set heat to suit the hair texture, use a heat protectant, and rest the tool on a heat-safe stand.',
        position: [1.2, 0.15, 0.3],
      },
    ],
  },
  esthetics: {
    title: '3D esthetics treatment room',
    points: [
      {
        id: 'tzone',
        label: 'T-zone',
        description:
          'Forehead, nose and chin. Note oil and texture here during the skin analysis; do not diagnose medical conditions.',
        position: [0, 0.75, 0.62],
      },
      {
        id: 'drape',
        label: 'Client draping',
        description: 'Drape and secure the hairline before cleansing to protect hair and clothing.',
        position: [0, 0.2, -0.6],
      },
      {
        id: 'lamp',
        label: 'Magnifying lamp',
        description:
          'Use the lamp for analysis. Shield the client\u2019s eyes and keep the lens covered when not in use.',
        position: [0.9, 1.55, 0.4],
      },
      {
        id: 'product',
        label: 'Treatment products',
        description: 'Dispense with a clean spatula; never return product to the container.',
        position: [-1.2, 0.05, 0.3],
      },
    ],
  },
  nail: {
    title: '3D nail station',
    points: [
      {
        id: 'plate',
        label: 'Nail plate',
        description:
          'Inspect for lifting, discoloration or damage before service. Refer the client out rather than diagnosing.',
        position: [0.1, 0.32, 0.92],
      },
      {
        id: 'cuticle',
        label: 'Cuticle area',
        description: 'Push back gently. Do not cut living skin; it can open a path for infection.',
        position: [-0.15, 0.32, 0.72],
      },
      {
        id: 'clean',
        label: 'Clean tool tray',
        description: 'Only cleaned and disinfected implements go here, kept covered until used.',
        position: [-1.15, 0.12, 0.2],
      },
      {
        id: 'used',
        label: 'Used tool container',
        description:
          'Place used implements here immediately. They stay separate until cleaned and disinfected.',
        position: [1.15, 0.12, 0.2],
      },
    ],
  },
};

function Head({ hair, long }: { hair: string; long?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} scale={[0.62, 0.75, 0.62]}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      <mesh position={[0, 0.62, -0.05]} scale={[0.66, 0.66, 0.66]}>
        <sphereGeometry args={[1, 40, 40, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hair} />
      </mesh>
      {long && (
        <mesh position={[0, 0.1, -0.35]} scale={[0.6, 0.65, 0.3]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      )}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.55, 32]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.62, 0.4, 0.05]} scale={[0.08, 0.18, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
      ))}
    </group>
  );
}

function Tool({
  position,
  color,
  size,
}: {
  position: [number, number, number];
  color: string;
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Scene({ variant }: { variant: StationVariant }) {
  if (variant === 'nail')
    return (
      <group>
        <Tool position={[0, -0.05, 0.3]} color="#e7e5e4" size={[3.2, 0.1, 1.6]} />
        <mesh position={[0, 0.22, 0.3]} scale={[0.45, 0.12, 0.38]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        {[-0.3, -0.1, 0.1, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.24, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.3, 8, 16]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        ))}
        <Tool position={[-1.15, 0.05, 0.2]} color="#bfdbfe" size={[0.6, 0.12, 0.45]} />
        <Tool position={[1.15, 0.05, 0.2]} color="#fecaca" size={[0.6, 0.12, 0.45]} />
      </group>
    );
  if (variant === 'esthetics')
    return (
      <group>
        <Tool position={[0, -0.25, 0]} color="#f5f5f4" size={[1.6, 0.25, 2.6]} />
        <group rotation={[-Math.PI / 2.4, 0, 0]} position={[0, 0.05, -0.3]}>
          <Head hair="#3f2a22" />
        </group>
        <mesh position={[0, 0.1, -0.55]} scale={[0.75, 0.2, 0.25]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0.9, 1.55, 0.4]} rotation={[0.6, 0, 0]}>
          <torusGeometry args={[0.28, 0.06, 16, 40]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <Tool position={[0.9, 0.6, 0.0]} color="#94a3b8" size={[0.06, 1.8, 0.06]} />
        <Tool position={[-1.2, -0.05, 0.3]} color="#ddd6fe" size={[0.25, 0.45, 0.25]} />
      </group>
    );
  return (
    <group>
      <Head hair={variant === 'barber' ? '#1f1611' : '#5b3a29'} long={variant === 'cosmetology'} />
      <Tool position={[0, -0.8, 0]} color="#334155" size={[1.2, 0.18, 1.2]} />
      {variant === 'barber' ? (
        <>
          <Tool position={[1.25, 0.1, 0.3]} color="#475569" size={[0.18, 0.55, 0.12]} />
          <Tool position={[1.25, 0.42, 0.3]} color="#cbd5e1" size={[0.2, 0.1, 0.16]} />
        </>
      ) : (
        <>
          <Tool position={[-1.2, 0.05, 0.3]} color="#c4b5fd" size={[0.22, 0.5, 0.22]} />
          <mesh position={[1.2, 0.15, 0.3]} rotation={[0, 0, Math.PI / 2.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 24]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </>
      )}
    </group>
  );
}

function Marker({
  point,
  active,
  visited,
  onSelect,
}: {
  point: Point;
  active: boolean;
  visited: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={point.position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={active ? '#f59e0b' : visited ? '#16a34a' : '#dc2626'}
          emissive={active ? '#f59e0b' : visited ? '#16a34a' : '#dc2626'}
          emissiveIntensity={0.5}
        />
      </mesh>
      <Html distanceFactor={5} center style={{ pointerEvents: 'none' }}>
        <span className="block -translate-y-6 whitespace-nowrap rounded bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow">
          {point.label}
        </span>
      </Html>
    </group>
  );
}

/** Conceptual 3D rehearsal only; it never records hours, grades or practical sign-off. */
export default function WorkbookStation3D({ variant }: { variant: StationVariant }) {
  const station = STATIONS[variant];
  const [active, setActive] = useState<Point | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
  }, []);
  const select = (point: Point) => {
    setActive(point);
    setVisited((previous) => new Set(previous).add(point.id));
  };
  return (
    <div
      className="my-4 overflow-hidden rounded-2xl border border-slate-300 bg-white"
      aria-label={station.title}
      role="group"
    >
      <div className="border-b bg-slate-50 px-4 py-3">
        <h4 className="text-lg font-bold">{station.title}</h4>
        <p className="text-sm text-slate-700">
          Drag to rotate and pinch or scroll to zoom. Select each marker or name to learn that area.
        </p>
      </div>
      <div className="h-[340px] w-full bg-slate-100 sm:h-[400px]">
        <Canvas camera={{ position: [2.4, 1.6, 2.6], fov: 45 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 4]} intensity={1} />
          <directionalLight position={[-3, 3, -2]} intensity={0.35} />
          <Scene variant={variant} />
          {station.points.map((point) => (
            <Marker
              key={point.id}
              point={point}
              active={active?.id === point.id}
              visited={visited.has(point.id)}
              onSelect={() => select(point)}
            />
          ))}
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            autoRotate={!reduceMotion && !active}
            autoRotateSpeed={0.6}
          />
        </Canvas>
      </div>
      <div className="space-y-3 px-4 py-4">
        <p className="text-sm font-semibold text-slate-700">
          Areas explored: {visited.size} / {station.points.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {station.points.map((point) => (
            <button
              type="button"
              key={point.id}
              aria-pressed={active?.id === point.id}
              onClick={() => select(point)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold ${visited.has(point.id) ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-400 bg-white text-slate-900'}`}
            >
              {point.label}
            </button>
          ))}
        </div>
        {active && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed"
          >
            <strong>{active.label}:</strong> {active.description}
          </p>
        )}
      </div>
    </div>
  );
}
