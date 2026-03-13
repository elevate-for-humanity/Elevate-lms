'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

type Hotspot = {
  id: string
  label: string
  description: string
  position: [number, number, number]
}

type HVACSimulationProps = {
  modelPath: string
  title?: string
  hotspots?: Hotspot[]
  requiredHotspotIds?: string[]
  onComplete?: () => void
}

// Maps hotspot IDs to GLB mesh names for highlighting
const HOTSPOT_TO_MESH: Record<string, string[]> = {
  'compressor': ['Compressor'],
  'fan-motor': ['FanMotor', 'TopGrille'],
  'capacitor': ['Capacitor'],
  'contactor': ['Contactor'],
  'condenser-coil': ['Casing'],
  'refrigerant-lines': ['RefLine1', 'RefLine2'],
  'service-valves': ['RefLine1', 'RefLine2'],
}

const HIGHLIGHT_COLOR = new THREE.Color('#3b82f6')
const HIGHLIGHT_EMISSIVE = new THREE.Color('#3b82f6')

function Model({ modelPath, selectedHotspotId }: { modelPath: string; selectedHotspotId: string | null }) {
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef<THREE.Group>(null)
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map())

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Store original material for un-highlighting
        const mesh = child as THREE.Mesh
        if (!originalMaterials.current.has(mesh.name)) {
          originalMaterials.current.set(mesh.name, (mesh.material as THREE.Material).clone())
        }
      }
    })
    return clone
  }, [scene])

  // Highlight/unhighlight meshes when selection changes
  useEffect(() => {
    const highlightNames = selectedHotspotId ? (HOTSPOT_TO_MESH[selectedHotspotId] || []) : []

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshStandardMaterial
        const orig = originalMaterials.current.get(mesh.name) as THREE.MeshStandardMaterial | undefined

        if (highlightNames.includes(mesh.name)) {
          mat.emissive = HIGHLIGHT_EMISSIVE
          mat.emissiveIntensity = 0.4
        } else if (orig) {
          mat.emissive = orig.emissive || new THREE.Color(0x000000)
          mat.emissiveIntensity = orig.emissiveIntensity || 0
        }
      }
    })
  }, [selectedHotspotId, clonedScene])

  return <primitive ref={groupRef} object={clonedScene} scale={1.6} />
}

function HotspotMarker({
  hotspot,
  isClicked,
  onClick,
}: {
  hotspot: Hotspot
  isClicked: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={hotspot.position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isClicked ? '#22c55e' : hovered ? '#facc15' : '#ef4444'}
          emissive={isClicked ? '#22c55e' : hovered ? '#facc15' : '#ef4444'}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      <Html distanceFactor={4} center style={{ pointerEvents: 'none' }}>
        <div
          className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-bold shadow-lg ${
            isClicked ? 'bg-green-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
          }`}
          style={{ transform: 'translateY(-24px)' }}
        >
          {hotspot.label}
        </div>
      </Html>
    </group>
  )
}

export default function HVACSimulation({
  modelPath,
  title = 'HVAC Equipment Simulation',
  hotspots = [],
  requiredHotspotIds = [],
  onComplete,
}: HVACSimulationProps) {
  const [clickedIds, setClickedIds] = useState<Set<string>>(new Set())
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)

  const handleClick = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot)
    setClickedIds((prev) => {
      const next = new Set(prev)
      next.add(hotspot.id)
      const allDone = requiredHotspotIds.every((id) => next.has(id))
      if (allDone && !requiredHotspotIds.every((id) => prev.has(id))) {
        setTimeout(() => onComplete?.(), 600)
      }
      return next
    })
  }

  const progress = requiredHotspotIds.length
    ? Math.round((requiredHotspotIds.filter((id) => clickedIds.has(id)).length / requiredHotspotIds.length) * 100)
    : 0

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {title && (
        <div className="border-b bg-slate-50 px-5 py-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Click each highlighted component to identify it. Rotate the model by dragging.
          </p>
        </div>
      )}

      <div className="h-[420px] w-full bg-slate-100">
        <Canvas camera={{ position: [2.5, 2, 2.5], fov: 45 }} shadows gl={{ antialias: true }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
          <directionalLight position={[-3, 4, -2]} intensity={0.3} />

          <Suspense fallback={null}>
            <Model modelPath={modelPath} selectedHotspotId={selectedHotspot?.id || null} />
            {hotspots.map((h) => (
              <HotspotMarker
                key={h.id}
                hotspot={h}
                isClicked={clickedIds.has(h.id)}
                onClick={() => handleClick(h)}
              />
            ))}
          </Suspense>

          <OrbitControls enablePan={false} minDistance={2} maxDistance={6} minPolarAngle={0.3} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </div>

      {/* Info panel */}
      <div className="border-t px-5 py-4 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-slate-700">Components identified</span>
            <span className="text-slate-500">
              {requiredHotspotIds.filter((id) => clickedIds.has(id)).length} / {requiredHotspotIds.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {selectedHotspot && (
          <div className="rounded-lg bg-slate-50 border p-3">
            <div className="font-semibold text-slate-900">{selectedHotspot.label}</div>
            <p className="text-sm text-slate-600 mt-1">{selectedHotspot.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {hotspots.map((h) => (
            <div
              key={h.id}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                clickedIds.has(h.id) ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-500'
              }`}
            >
              {clickedIds.has(h.id) ? (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
              )}
              {h.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
