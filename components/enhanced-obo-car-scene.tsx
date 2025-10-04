"use client"

import { useRef, useEffect, Suspense } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody, CuboidCollider } from "@react-three/rapier"
import { Box, Sphere, Cylinder, Text, Html, useFBX } from "@react-three/drei"
import * as THREE from 'three'
import { useSimulationStore, AnimationState } from "@/lib/simulation-store"
import { useCarAnimation } from "@/hooks/use-car-animation"

// Define RigidBodyApi interface
interface RigidBodyApi {
  setTranslation: (translation: { x: number; y: number; z: number } | THREE.Vector3, wakeUp?: boolean) => void
  setRotation: (rotation: THREE.Quaternion | { x: number; y: number; z: number; w: number }, wakeUp?: boolean) => void
  setLinvel: (velocity: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  setAngvel: (velocity: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  applyImpulse: (impulse: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  applyTorqueImpulse: (torque: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  translation: () => { x: number; y: number; z: number }
  rotation: () => { x: number; y: number; z: number; w: number }
  linvel: () => { x: number; y: number; z: number }
  angvel: () => { x: number; y: number; z: number }
}

function CarMesh({ animationState }: { animationState: AnimationState }) {
  const meshRef = useRef<THREE.Group>(null)
  const fallbackRef = useRef<THREE.Mesh>(null)
  
  // Load FBX model - useFBX must be called unconditionally (React hooks rule)
  const fbx = useFBX("/models/OBOCAR.fbx")
  
  const fbxClone = useRef<THREE.Group | null>(null)
  const modelLoaded = useRef(false)
  
  // Add debugging
  useEffect(() => {
    console.log("FBX object received:", fbx)
    console.log("FBX type:", fbx?.type)
  }, [fbx])
  
  // Clone and setup FBX model
  useEffect(() => {
    if (fbx) {
      console.log("FBX loaded, setting up model...")
      const clonedFbx = fbx.clone()
      
      // Try different scales - FBX models can have very different base scales
      clonedFbx.scale.set(1, 1, 1) // Start with normal scale
      
      // Rotate the model to face forward (positive Z direction)
      // Rotate 180 degrees to face the correct direction
      clonedFbx.rotation.y = -Math.PI / 2 // -90 degrees
      
      // Log the bounding box to understand the model size
      const bbox = new THREE.Box3().setFromObject(clonedFbx)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      console.log("FBX Model size:", size)
      
      // Auto-scale to reasonable car size (about 2 units long)
      const maxDimension = Math.max(size.x, size.y, size.z)
      if (maxDimension > 0) {
        const targetSize = 4 // Target car length
        const scale = targetSize / maxDimension
        clonedFbx.scale.set(scale, scale, scale)
        console.log("Applied scale:", scale)
      }
      
      // Center the model
      bbox.setFromObject(clonedFbx)
      const center = new THREE.Vector3()
      bbox.getCenter(center)
      clonedFbx.position.sub(center)
      clonedFbx.position.y = 0 // Keep on ground
      
      // Set up materials - preserve original colors and fix thin parts visibility
      clonedFbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          const mesh = child as THREE.Mesh
          console.log("Found mesh in FBX:", mesh.name)
          
          // Keep original materials and colors from the FBX file
          // Enable double-sided rendering to fix thin parts disappearing
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                const material = mat as THREE.MeshStandardMaterial
                // Enable double-sided rendering for thin parts
                material.side = THREE.DoubleSide
                // Disable backface culling
                material.depthWrite = true
                material.depthTest = true
                material.needsUpdate = true
              })
            } else {
              const material = mesh.material as THREE.MeshStandardMaterial
              // Enable double-sided rendering for thin parts
              material.side = THREE.DoubleSide
              // Disable backface culling
              material.depthWrite = true
              material.depthTest = true
              material.needsUpdate = true
            }
          }
        }
      })
      
      fbxClone.current = clonedFbx
      modelLoaded.current = true
      console.log("FBX model setup complete!")
    }
  }, [fbx])
  
  // Remove color-changing animation feedback for FBX model to preserve original colors
  useFrame((state, delta) => {
    // Only change colors if using fallback geometry (not FBX)
    if (!fbxClone.current && fallbackRef.current && fallbackRef.current.material) {
      // Update fallback box color based on animation state
      const material = fallbackRef.current.material as THREE.MeshStandardMaterial
      switch (animationState) {
        case AnimationState.MOVING_FORWARD:
          material.color.setHex(0x00ff00)
          break
        case AnimationState.MOVING_BACKWARD:
          material.color.setHex(0xff6600)
          break
        case AnimationState.TURNING_LEFT:
        case AnimationState.TURNING_RIGHT:
          material.color.setHex(0x0066ff)
          break
        case AnimationState.STOPPING:
          material.color.setHex(0xff0000)
          break
        default:
          material.color.setHex(0x3b82f6)
      }
    }
  })

  return (
    <group ref={meshRef}>
      {fbx ? (
        <primitive object={fbx} scale={0.025} rotation={[0, -Math.PI / 2, 0]} position={[0, 0, 0]} />
      ) : (
        // Fallback visible geometry while loading or if FBX fails
        <group>
          <Box ref={fallbackRef} args={[2, 0.8, 4]} castShadow receiveShadow>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
          <Box args={[1.8, 0.6, 2]} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
          </Box>
        </group>
      )}
    </group>
  )
}

function SensorVisualization() {
  const { sensorData, debugMode } = useSimulationStore()
  
  if (!debugMode) return null
  
  return (
    <group>
      {/* Front sensor */}
      <Box args={[0.1, 0.1, sensorData.front]} position={[0, 0.5, sensorData.front / 2]}>
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </Box>
      
      {/* Left sensor */}
      <Box args={[sensorData.left, 0.1, 0.1]} position={[-sensorData.left / 2, 0.5, 0]}>
        <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
      </Box>
      
      {/* Right sensor */}
      <Box args={[sensorData.right, 0.1, 0.1]} position={[sensorData.right / 2, 0.5, 0]}>
        <meshBasicMaterial color="#0000ff" transparent opacity={0.3} />
      </Box>
      
      {/* Back sensor */}
      <Box args={[0.1, 0.1, sensorData.back]} position={[0, 0.5, -sensorData.back / 2]}>
        <meshBasicMaterial color="#ffff00" transparent opacity={0.3} />
      </Box>
    </group>
  )
}

function ObstacleComponent({ obstacle }: { obstacle: any }) {
  return (
    <RigidBody type="fixed" position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}>
      <Box args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} castShadow receiveShadow>
        <meshStandardMaterial color={obstacle.color} />
      </Box>
    </RigidBody>
  )
}

function AnimationStateDisplay() {
  const { carAnimation, currentCommand, debugMode } = useSimulationStore()
  
  if (!debugMode) return null
  
  return (
    <Html position={[0, 3, 0]} center>
      <div className="bg-black bg-opacity-75 text-white p-2 rounded text-sm">
        <div>State: {carAnimation.currentState}</div>
        <div>Progress: {(carAnimation.animationProgress * 100).toFixed(1)}%</div>
        {currentCommand && (
          <div>Command: {currentCommand.type} ({currentCommand.value || 'default'})</div>
        )}
      </div>
    </Html>
  )
}

function OboCarScene() {
  const carRef = useRef<any>(null)
  const isMounted = useRef(false)
  
  const {
    carPhysics,
    obstacles,
    updateSensorData,
    isRunning,
    debugMode
  } = useSimulationStore()

  // Always call the car animation hook in the same order
  const { animationState } = useCarAnimation({ carRef })
  
  // Set mounted flag on first render
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Update sensor readings based on obstacles and environment
  useFrame(() => {
    if (carRef.current && isRunning && isMounted.current) {
      const position = carRef.current.translation()
      
      // Calculate sensor readings for all directions
      const sensorReadings = {
        front: calculateSensorDistance(position, 'front', obstacles),
        left: calculateSensorDistance(position, 'left', obstacles),
        right: calculateSensorDistance(position, 'right', obstacles),
        back: calculateSensorDistance(position, 'back', obstacles),
       
      }

      updateSensorData(sensorReadings)
    }
  })

  return (
    <Suspense fallback={
      <Html center>
        <div className="text-primary font-medium">Loading Car Scene...</div>
      </Html>
    }>
      {/* Car with physics */}
      <RigidBody
        ref={carRef}
        position={[carPhysics.position.x, carPhysics.position.y, carPhysics.position.z]}
        rotation={[carPhysics.rotation.x, carPhysics.rotation.y, carPhysics.rotation.z]}
        type="dynamic"
        mass={carPhysics.mass}
        friction={carPhysics.friction}
        colliders={false}
        enabledRotations={[false, true, false]} // Only allow Y-axis rotation
        linearDamping={0.5}
        angularDamping={0.8}
      >
        {/* Custom invisible collider for physics - positioned at bottom of car */}
        <CuboidCollider args={[1, 0.5, 2]} position={[0, 0, 0]} />
        
        <CarMesh animationState={animationState} />
        <SensorVisualization />
      </RigidBody>

      {/* Animation state display */}
      <AnimationStateDisplay />

      {/* Obstacles */}
      {obstacles.map((obstacle) => (
        <ObstacleComponent key={obstacle.id} obstacle={obstacle} />
      ))}

      {/* Ground */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <Box args={[50, 1, 50]} receiveShadow>
          <meshStandardMaterial color="#90EE90" />
        </Box>
      </RigidBody>

      {/* Boundary walls */}
      <RigidBody type="fixed" position={[25, 1, 0]}>
        <Box args={[1, 2, 50]} castShadow receiveShadow>
          <meshStandardMaterial color="#8B4513" />
        </Box>
      </RigidBody>
      <RigidBody type="fixed" position={[-25, 1, 0]}>
        <Box args={[1, 2, 50]} castShadow receiveShadow>
          <meshStandardMaterial color="#8B4513" />
        </Box>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 1, 25]}>
        <Box args={[50, 2, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#8B4513" />
        </Box>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 1, -25]}>
        <Box args={[50, 2, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#8B4513" />
        </Box>
      </RigidBody>
    </Suspense>
  )
}

// Helper function to calculate sensor distances
function calculateSensorDistance(
  carPosition: { x: number; y: number; z: number },
  direction: string,
  obstacles: any[]
): number {
  // Default sensor range
  const maxRange = 10
  let minDistance = maxRange

  // Calculate direction vector based on sensor type
  let directionVector = { x: 0, z: 0 }
  switch (direction) {
    case 'front':
      directionVector = { x: 0, z: 1 }
      break
    case 'back':
      directionVector = { x: 0, z: -1 }
      break
    case 'left':
      directionVector = { x: -1, z: 0 }
      break
    case 'right':
      directionVector = { x: 1, z: 0 }
      break
   
  }

  // Check distance to obstacles
  obstacles.forEach(obstacle => {
    const dx = obstacle.position.x - carPosition.x
    const dz = obstacle.position.z - carPosition.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    // Check if obstacle is in the sensor direction
    const dotProduct = dx * directionVector.x + dz * directionVector.z
    if (dotProduct > 0 && distance < minDistance) {
      minDistance = distance - Math.max(obstacle.size.x, obstacle.size.z) / 2
    }
  })

  // Check distance to boundaries
  switch (direction) {
    case 'front':
      minDistance = Math.min(minDistance, 25 - carPosition.z)
      break
    case 'back':
      minDistance = Math.min(minDistance, 25 + carPosition.z)
      break
    case 'left':
      minDistance = Math.min(minDistance, 25 + carPosition.x)
      break
    case 'right':
      minDistance = Math.min(minDistance, 25 - carPosition.x)
      break
  }

  return Math.max(0, minDistance)
}

// Export the component
export { OboCarScene }