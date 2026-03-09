'use client'

import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Maps GLB mesh names to component IDs and descriptions
const COMPONENT_MAP: Record<string, {
  id: string
  label: string
  description: string
  problems: string
}> = {
  Compressor: {
    id: 'compressor',
    label: 'Compressor',
    description: 'Pumps refrigerant through the entire system. Compresses low-pressure gas into high-pressure, high-temperature gas that flows to the condenser coil.',
    problems: 'High amperage draw, hard starting, overheating, mechanical seizure. A failed compressor usually means full system replacement on older units.',
  },
  FanMotor: {
    id: 'fan-motor',
    label: 'Fan Motor',
    description: 'Drives the fan blade that pulls outdoor air across the condenser coil to reject heat from the refrigerant.',
    problems: 'Seized bearings, weak capacitor causing slow startup, overheating from restricted airflow. Spin the blade by hand — it should rotate freely.',
  },
  TopGrille: {
    id: 'fan-motor',
    label: 'Fan Motor (Grille)',
    description: 'The protective grille covers the condenser fan. The fan motor sits behind it and pulls air across the condenser coil.',
    problems: 'Debris buildup on grille restricts airflow. Keep area clear of leaves, grass clippings, and obstructions.',
  },
  Capacitor: {
    id: 'capacitor',
    label: 'Capacitor',
    description: 'Stores and releases electrical energy to start and run the compressor and fan motors. A dual-run capacitor handles both motors.',
    problems: 'The #1 most common failure point in residential HVAC. Bulging top, leaking oil, low µF reading. Test with multimeter — replace if more than 10% below rated value.',
  },
  Contactor: {
    id: 'contactor',
    label: 'Contactor',
    description: 'Electrically controlled switch. When the thermostat calls for cooling, 24V energizes the coil which closes contacts to connect 240V to the compressor and fan motor.',
    problems: 'Pitted or burned contacts, stuck coil, chattering. Inspect contact surfaces for carbon buildup. Replace if visibly damaged.',
  },
  Casing: {
    id: 'condenser-coil',
    label: 'Condenser Coil / Cabinet',
    description: 'The condenser coil wraps around the inside of the cabinet. Copper tubing with aluminum fins. Hot refrigerant gas releases heat to outdoor air as the fan pulls air across the fins.',
    problems: 'Dirty or clogged fins, bent fins restricting airflow, corrosion. Clean from inside out with low-pressure water. Never use a pressure washer.',
  },
  RefLine1: {
    id: 'service-valves',
    label: 'Refrigerant Line / Service Valve (Suction)',
    description: 'The larger copper tube is the suction (vapor) line carrying low-pressure gas back to the compressor. Service valves on this line provide access for gauge manifolds.',
    problems: 'Missing valve caps cause slow refrigerant leaks. Oil stains around fittings indicate a leak. Replace Schrader valve cores every service visit.',
  },
  RefLine2: {
    id: 'refrigerant-lines',
    label: 'Refrigerant Line (Liquid)',
    description: 'The smaller copper tube is the liquid line carrying high-pressure liquid refrigerant to the indoor expansion device.',
    problems: 'Leaks at fittings, missing insulation on suction line, kinks restricting flow.',
  },
  BasePad: {
    id: 'base',
    label: 'Condenser Base Pad',
    description: 'The concrete or composite pad the condenser unit sits on. Keeps the unit level and off the ground.',
    problems: 'Settling or tilting causes vibration and stress on refrigerant lines. Unit must be level for proper oil return to compressor.',
  },
}

const HIGHLIGHT_EMISSIVE = new THREE.Color('#3b82f6')
const DEFAULT_EMISSIVE = new THREE.Color(0x000000)

function CondenserModel({ onComponentClick, selectedId }: {
  onComponentClick: (meshName: string) => void
  selectedId: string | null
}) {
  const { scene } = useGLTF('/models/hvac-condenser.glb')

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        // Clone material so we can modify per-mesh
        mesh.material = (mesh.material as THREE.Material).clone()
      }
    })
    return clone
  }, [scene])

  // Update highlights when selection changes
  useMemo(() => {
    const selectedMeshNames = selectedId
      ? Object.entries(COMPONENT_MAP)
          .filter(([, comp]) => comp.id === selectedId)
          .map(([meshName]) => meshName)
      : []

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (selectedMeshNames.includes(mesh.name)) {
          mat.emissive = HIGHLIGHT_EMISSIVE
          mat.emissiveIntensity = 0.4
        } else {
          mat.emissive = DEFAULT_EMISSIVE
          mat.emissiveIntensity = 0
        }
      }
    })
  }, [selectedId, clonedScene])

  function handleClick(e: any) {
    e.stopPropagation()
    const meshName = e.object.name
    if (COMPONENT_MAP[meshName]) {
      onComponentClick(meshName)
    }
  }

  return <primitive object={clonedScene} scale={1.6} onClick={handleClick} />
}

export default function HVACLab({ onAllIdentified }: { onAllIdentified?: () => void }) {
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [identifiedIds, setIdentifiedIds] = useState<Set<string>>(new Set())

  const selectedComponent = selectedMesh ? COMPONENT_MAP[selectedMesh] : null

  // Unique required component IDs (excluding base pad)
  const requiredIds = ['compressor', 'fan-motor', 'capacitor', 'contactor', 'condenser-coil', 'refrigerant-lines', 'service-valves']
  const allIdentified = requiredIds.every((id) => identifiedIds.has(id))

  function handleComponentClick(meshName: string) {
    setSelectedMesh(meshName)
    const comp = COMPONENT_MAP[meshName]
    if (comp && requiredIds.includes(comp.id)) {
      setIdentifiedIds((prev) => {
        const next = new Set(prev)
        next.add(comp.id)
        if (!allIdentified && requiredIds.every((id) => next.has(id))) {
          setTimeout(() => onAllIdentified?.(), 500)
        }
        return next
      })
    }
  }

  const progress = Math.round((requiredIds.filter((id) => identifiedIds.has(id)).length / requiredIds.length) * 100)

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-slate-50 px-5 py-3">
        <h3 className="text-lg font-bold text-slate-900">3D HVAC Equipment Lab</h3>
        <p className="text-sm text-slate-600 mt-0.5">
          Click directly on any component to identify it. Drag to rotate. Scroll to zoom.
        </p>
      </div>

      <div className="h-[500px] w-full bg-gradient-to-b from-slate-100 to-slate-200 cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [2.5, 2, 2.5], fov: 45 }} shadows gl={{ antialias: true }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
          <directionalLight position={[-3, 4, -2]} intensity={0.3} />

          <Suspense fallback={null}>
            <CondenserModel
              onComponentClick={handleComponentClick}
              selectedId={selectedComponent?.id || null}
            />
          </Suspense>

          <OrbitControls enablePan={false} minDistance={2} maxDistance={6} minPolarAngle={0.3} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </div>

      <div className="border-t px-5 py-4 space-y-3">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-slate-700">Components identified</span>
            <span className="text-slate-500">
              {requiredIds.filter((id) => identifiedIds.has(id)).length} / {requiredIds.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Selected component detail */}
        {selectedComponent && (
          <div className="rounded-lg bg-slate-50 border p-4">
            <div className="font-bold text-slate-900 text-lg">{selectedComponent.label}</div>
            <p className="text-sm text-slate-700 mt-2">{selectedComponent.description}</p>
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-0.5">Common problems</div>
              <p className="text-sm text-amber-900">{selectedComponent.problems}</p>
            </div>
          </div>
        )}

        {!selectedComponent && (
          <div className="rounded-lg bg-slate-50 border p-4 text-center text-sm text-slate-500">
            Click on any part of the condenser unit to learn about it.
          </div>
        )}

        {/* Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {requiredIds.map((id) => {
            const label = Object.values(COMPONENT_MAP).find((c) => c.id === id)?.label.split(' (')[0] || id
            const done = identifiedIds.has(id)
            return (
              <div key={id} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${done ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-500'}`}>
                {done ? (
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                {label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
