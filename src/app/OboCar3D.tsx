// OboCar3D.tsx
// 3D simulation panel for OboCar using Three.js and @react-three/fiber
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Line } from "@react-three/drei";
import * as THREE from "three";


import { useOboCarPhysics } from "./OboCarPhysics";
type OboCarProps = { apiRef?: React.MutableRefObject<any> };
function OboCar({ apiRef }: OboCarProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const [trail, setTrail] = useState<THREE.Vector3[]>([]);
  const api = useOboCarPhysics(ref);
  if (apiRef) apiRef.current = api;

  // Listen for car-reset event to reset car position/rotation and clear trail
  useEffect(() => {
    const resetHandler = () => {
      if (api && api.reset) api.reset();
      setTrail([]);
    };
    window.addEventListener("car-reset", resetHandler);
    return () => window.removeEventListener("car-reset", resetHandler);
  }, [api]);

  // Update movement trail
  useFrame(() => {
    if (ref.current) {
      setTrail(prev => {
        const last = prev[prev.length - 1];
        const pos = ref.current.position.clone();
        if (!last || !last.equals(pos)) {
          return [...prev.slice(-199), pos]; // keep last 200 points
        }
        return prev;
      });
    }
  });

  // Upgraded car design: body, wheels, windows, lights, and details
  return (
    <group ref={ref}>
      {/* Main body */}
      <mesh castShadow position={[0, 0.13, 0]}>
        <boxGeometry args={[0.42, 0.18, 0.7]} />
        <meshStandardMaterial color="#2dd4bf" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 0.23, 0.05]}>
        <boxGeometry args={[0.32, 0.13, 0.36]} />
        <meshPhysicalMaterial color="#e0e7ef" metalness={0.2} roughness={0.05} transmission={0.7} transparent opacity={0.7} />
      </mesh>
      {/* Front hood (red) */}
      <mesh position={[0, 0.17, 0.26]}>
        <boxGeometry args={[0.36, 0.06, 0.16]} />
        <meshStandardMaterial color="#e11d48" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Rear trunk (blue) */}
      <mesh position={[0, 0.17, -0.26]}>
        <boxGeometry args={[0.36, 0.06, 0.16]} />
        <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Wheels */}
      {[[-0.18, 0.07, 0.23], [0.18, 0.07, 0.23], [-0.18, 0.07, -0.23], [0.18, 0.07, -0.23]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Windows (front and sides) */}
      <mesh position={[0, 0.25, 0.15]}>
        <boxGeometry args={[0.28, 0.09, 0.01]} />
        <meshPhysicalMaterial color="#b6e0fe" metalness={0.1} roughness={0.05} transmission={0.8} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.15, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.28, 0.09, 0.01]} />
        <meshPhysicalMaterial color="#b6e0fe" metalness={0.1} roughness={0.05} transmission={0.8} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.15, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.28, 0.09, 0.01]} />
        <meshPhysicalMaterial color="#b6e0fe" metalness={0.1} roughness={0.05} transmission={0.8} transparent opacity={0.6} />
      </mesh>
      {/* Headlights (yellow) */}
      <mesh position={[-0.09, 0.15, 0.36]}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.09, 0.15, 0.36]}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.7} />
      </mesh>
      {/* Taillights (red) */}
      <mesh position={[-0.09, 0.15, -0.36]}>
        <cylinderGeometry args={[0.012, 0.012, 0.025, 16]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.09, 0.15, -0.36]}>
        <cylinderGeometry args={[0.012, 0.012, 0.025, 16]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
      </mesh>
      {/* Spotlights for real headlight effect */}
      <spotLight
        position={[0.12, 0.13, 0.38]}
        angle={0.3}
        penumbra={0.5}
        intensity={1.5}
        distance={2}
        color="#fbbf24"
        castShadow
      />
      <spotLight
        position={[-0.12, 0.13, 0.38]}
        angle={0.3}
        penumbra={0.5}
        intensity={1.5}
        distance={2}
        color="#fbbf24"
        castShadow
      />
      {/* Movement trail */}
      {trail.length > 1 && (
        <Line
          points={trail.map(v => [v.x, v.y + 0.02, v.z])}
          color="#38bdf8"
          lineWidth={2}
          dashed={false}
        />
      )}
    </group>
  );
}
export default function OboCar3D() {
  const [contextLost, setContextLost] = useState(false);
  const apiRef = useRef<any>(null);
  const [sensorData, setSensorData] = useState<any>(null);


  // Keyboard controls for demo: W/S = move, A/D = rotate
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!apiRef.current) return;
      if (e.key === "w") apiRef.current.move(2);
      if (e.key === "s") apiRef.current.move(-2);
      if (e.key === "a") apiRef.current.rotate(2);
      if (e.key === "d") apiRef.current.rotate(-2);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // Listen for car-move, car-rotate, car-forward, car-rotateBy events from Python code
  useEffect(() => {
    const moveHandler = (e: Event) => {
      if (!apiRef.current) return;
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.speed === "number") {
        apiRef.current.move(detail.speed);
      }
    };
    const rotateHandler = (e: Event) => {
      if (!apiRef.current) return;
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.angle === "number") {
        apiRef.current.rotate(detail.angle);
      }
    };
    const forwardHandler = (e: Event) => {
      if (!apiRef.current) return;
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.speed === "number" && typeof detail?.duration === "number") {
        apiRef.current.forward(detail.speed, detail.duration);
      }
    };
    const rotateByHandler = (e: Event) => {
      if (!apiRef.current) return;
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.angle === "number" && typeof detail?.duration === "number") {
        apiRef.current.rotateBy(detail.angle, detail.duration);
      }
    };
    window.addEventListener("car-move", moveHandler);
    window.addEventListener("car-rotate", rotateHandler);
    window.addEventListener("car-forward", forwardHandler);
    window.addEventListener("car-rotateBy", rotateByHandler);
    return () => {
      window.removeEventListener("car-move", moveHandler);
      window.removeEventListener("car-rotate", rotateHandler);
      window.removeEventListener("car-forward", forwardHandler);
      window.removeEventListener("car-rotateBy", rotateByHandler);
    };
  }, []);

  // Poll sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      if (apiRef.current) {
        const sensors = apiRef.current.getSensors();
        setSensorData(sensors);
        // Expose for output panel warning logic
        // @ts-ignore
        window.oboCarSensorData = sensors;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (contextLost) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-red-400 bg-black/80">
        <p className="text-lg font-bold">WebGL context lost.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-700 rounded text-white font-semibold hover:bg-blue-800"
          onClick={() => setContextLost(false)}
        >
          Reload 3D Simulation
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Subtle static background gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-900/30 via-transparent to-indigo-900/40" />
      <Canvas
        shadows
        camera={{ position: [2, 2, 2], fov: 50 }}
        style={{ width: "100vw", height: "100vh", background: "transparent" }}
        dpr={window.devicePixelRatio || 1}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.getContext().canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <ambientLight intensity={0.7} color="#a7f3d0" />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} color="#38bdf8" />
        <OboCar apiRef={apiRef} />
        {/* Large but not unlimited grid and plane for performance */}
        <Grid args={[200, 200]} cellColor="#334155" sectionColor="#38bdf8" fadeDistance={40} fadeStrength={0.5} position={[0, 0.01, 0]} />
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
        <Environment preset="city" background={false} />
        <OrbitControls enablePan enableZoom enableRotate maxDistance={80} minDistance={2} />
      </Canvas>
      {/* Modern border effect, no blur */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-cyan-400/10 shadow-[0_0_40px_5px_rgba(34,211,238,0.08)] z-10" />
    </div>
  );
}
