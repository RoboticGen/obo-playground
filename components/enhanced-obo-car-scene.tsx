"use client"

import { useRef, useEffect, Suspense } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { Box, Sphere, Cylinder, Text, Html } from "@react-three/drei"
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
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Add visual feedback based on animation state
  useFrame((state, delta) => {
    if (!meshRef.current || !meshRef.current.material) return
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial
    
    // Add subtle visual effects based on state
    switch (animationState) {
      case AnimationState.MOVING_FORWARD:
        material.color.setHex(0x00ff00) // Green when moving forward
        break
      case AnimationState.MOVING_BACKWARD:
        material.color.setHex(0xff6600) // Orange when moving backward
        break
      case AnimationState.TURNING_LEFT:
      case AnimationState.TURNING_RIGHT:
        material.color.setHex(0x0066ff) // Blue when turning
        break
      case AnimationState.STOPPING:
        material.color.setHex(0xff0000) // Red when stopping
        break
      default:
        material.color.setHex(0x3b82f6) // Default blue
    }
  })

  return (
    <group>
      {/* Main car body */}
      <Box ref={meshRef} args={[2, 0.8, 4]} castShadow receiveShadow>
        <meshStandardMaterial />
      </Box>
      
      {/* Car windows */}
      <Box args={[1.8, 0.6, 2]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
      </Box>
      
      {/* Wheels */}
      <Cylinder args={[0.4, 0.4, 0.2]} position={[-0.8, -0.4, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#2d2d2d" />
      </Cylinder>
      <Cylinder args={[0.4, 0.4, 0.2]} position={[0.8, -0.4, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#2d2d2d" />
      </Cylinder>
      <Cylinder args={[0.4, 0.4, 0.2]} position={[-0.8, -0.4, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#2d2d2d" />
      </Cylinder>
      <Cylinder args={[0.4, 0.4, 0.2]} position={[0.8, -0.4, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#2d2d2d" />
      </Cylinder>
      
      {/* Headlights */}
      <Sphere args={[0.15]} position={[-0.6, 0, 2]} castShadow>
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.15]} position={[0.6, 0, 2]} castShadow>
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.3} />
      </Sphere>
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

export function OboCarScene() {
  const carRef = useRef<any>(null)
  const {
    carPhysics,
    obstacles,
    updateSensorData,
    isRunning,
    debugMode
  } = useSimulationStore()

  // Use the car animation hook
  const { animationState } = useCarAnimation({ carRef })

  // Update sensor readings based on obstacles and environment
  useFrame(() => {
    if (carRef.current && isRunning) {
      const position = carRef.current.translation()
      
      // Calculate sensor readings for all directions
      const sensorReadings = {
        front: calculateSensorDistance(position, 'front', obstacles),
        left: calculateSensorDistance(position, 'left', obstacles),
        right: calculateSensorDistance(position, 'right', obstacles),
        back: calculateSensorDistance(position, 'back', obstacles),
        frontLeft: calculateSensorDistance(position, 'frontLeft', obstacles),
        frontRight: calculateSensorDistance(position, 'frontRight', obstacles),
        backLeft: calculateSensorDistance(position, 'backLeft', obstacles),
        backRight: calculateSensorDistance(position, 'backRight', obstacles),
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
        colliders="cuboid"
        enabledRotations={[false, true, false]} // Only allow Y-axis rotation
        linearDamping={0.5}
        angularDamping={0.8}
      >
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
    case 'frontLeft':
      directionVector = { x: -0.707, z: 0.707 }
      break
    case 'frontRight':
      directionVector = { x: 0.707, z: 0.707 }
      break
    case 'backLeft':
      directionVector = { x: -0.707, z: -0.707 }
      break
    case 'backRight':
      directionVector = { x: 0.707, z: -0.707 }
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