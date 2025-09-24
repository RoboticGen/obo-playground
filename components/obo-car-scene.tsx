"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody, type RigidBodyApi } from "@react-three/rapier"
import { Box, Sphere, Cylinder, Text } from "@react-three/drei"
import { useSimulationStore } from "@/lib/car-control-system"

export function OboCarScene() {
  const carRef = useRef<RigidBodyApi>(null)
  const { car, obstacles, updateSensorReadings, isRunning } = useSimulationStore()

  useEffect(() => {
    if (!isRunning && carRef.current) {
      console.log("[v0] Resetting car to start position")
      carRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true)
      carRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    }
  }, [isRunning])

  useEffect(() => {
    if (carRef.current && isRunning) {
      console.log(`[v0] 🔄 Updating car position to: [${car.position[0]}, ${car.position[1]}, ${car.position[2]}], rotation: ${car.rotation}°`)
      
      // Set position
      carRef.current.setTranslation({ x: car.position[0], y: car.position[1], z: car.position[2] }, true)
      
      // Set rotation
      const rotationRad = (car.rotation * Math.PI) / 180
      carRef.current.setRotation({ x: 0, y: rotationRad, z: 0, w: 1 }, true)
      
      // Log actual position and rotation after setting
      const actualPos = carRef.current.translation()
      console.log(`[v0] ✅ Car 3D object updated to position: [${actualPos.x.toFixed(2)}, ${actualPos.y.toFixed(2)}, ${actualPos.z.toFixed(2)}]`)
    }
  }, [car.position, car.rotation, isRunning])

  // Update sensor readings based on obstacles
  useFrame(() => {
    if (carRef.current) {
      const position = carRef.current.translation()

      // Calculate sensor readings for all directions
      const sensorReadings = {
        front: 10,
        left: 10,
        right: 10,
        back: 10,
      }

      obstacles.forEach((obstacle) => {
        const dx = obstacle.position[0] - position.x
        const dz = obstacle.position[2] - position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Determine which sensor detects this obstacle
        const angle = (Math.atan2(dz, dx) * 180) / Math.PI
        const carAngle = car.rotation
        const relativeAngle = ((angle - carAngle + 180) % 360) - 180

        if (Math.abs(relativeAngle) < 45) {
          sensorReadings.front = Math.min(sensorReadings.front, distance)
        } else if (relativeAngle >= 45 && relativeAngle < 135) {
          sensorReadings.left = Math.min(sensorReadings.left, distance)
        } else if (relativeAngle >= 135 || relativeAngle < -135) {
          sensorReadings.back = Math.min(sensorReadings.back, distance)
        } else {
          sensorReadings.right = Math.min(sensorReadings.right, distance)
        }
      })

      updateSensorReadings(sensorReadings)
    }
  })

  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <Box args={[20, 1, 20]} receiveShadow>
          <meshStandardMaterial color="#e5e7eb" />
        </Box>
      </RigidBody>

      {/* Grid Lines for better spatial reference */}
      {Array.from({ length: 21 }, (_, i) => i - 10).map((i) => (
        <group key={`grid-${i}`}>
          <Box args={[0.02, 0.01, 20]} position={[i, 0.01, 0]}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.3} />
          </Box>
          <Box args={[20, 0.01, 0.02]} position={[0, 0.01, i]}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.3} />
          </Box>
        </group>
      ))}

      {/* Path Visualization */}
      {car.pathHistory.map((point, index) => (
        <Sphere key={index} args={[0.05]} position={point}>
          <meshStandardMaterial color="#3b82f6" opacity={Math.max(0.2, 1 - index * 0.05)} transparent />
        </Sphere>
      ))}

      {/* Obo Car */}
      <RigidBody ref={carRef} position={[0, 1, 0]} colliders="cuboid" type="kinematicPosition">
        <group>
          {/* Car Body - Made bigger and brighter for visibility */}
          <Box args={[3, 0.8, 1.5]} position={[0, 0.4, 0]} castShadow>
            <meshStandardMaterial color={isRunning ? "#60a5fa" : "#6b7280"} emissive={isRunning ? "#3b82f6" : "#4b5563"} emissiveIntensity={0.5} />
          </Box>

          {/* Car Top */}
          <Box args={[1.8, 0.6, 1.2]} position={[0, 1.1, 0]} castShadow>
            <meshStandardMaterial color={isRunning ? "#2563eb" : "#4b5563"} emissive={isRunning ? "#1e40af" : "#374151"} emissiveIntensity={0.5} />
          </Box>
          
          {/* Direction Indicator (shows which way is forward) */}
          <Box args={[1, 0.3, 0.3]} position={[1.5, 0.7, 0]} castShadow>
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
          </Box>

          {/* Wheels */}
          {[
            [0.7, -0.1, 0.6],
            [0.7, -0.1, -0.6],
            [-0.7, -0.1, 0.6],
            [-0.7, -0.1, -0.6],
          ].map((pos, i) => (
            <Cylinder key={i} args={[0.2, 0.2, 0.1]} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <meshStandardMaterial color="#1f2937" />
            </Cylinder>
          ))}

          {/* Multi-directional Sensors */}
          {/* Front Sensor */}
          <Sphere args={[0.08]} position={[1, 0.5, 0]} castShadow>
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={car.sensorReadings.front < 3 ? 0.8 : 0.3}
            />
          </Sphere>

          {/* Left Sensor */}
          <Sphere args={[0.06]} position={[0, 0.5, 0.8]} castShadow>
            <meshStandardMaterial
              color="#10b981"
              emissive="#10b981"
              emissiveIntensity={car.sensorReadings.left < 3 ? 0.8 : 0.3}
            />
          </Sphere>

          {/* Right Sensor */}
          <Sphere args={[0.06]} position={[0, 0.5, -0.8]} castShadow>
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#8b5cf6"
              emissiveIntensity={car.sensorReadings.right < 3 ? 0.8 : 0.3}
            />
          </Sphere>

          {/* Sensor Beams */}
          <Box args={[car.sensorReadings.front, 0.02, 0.02]} position={[1 + car.sensorReadings.front / 2, 0.5, 0]}>
            <meshStandardMaterial color="#f59e0b" transparent opacity={0.3} />
          </Box>

          {/* Battery Indicator */}
          <Box args={[0.3, 0.1, 0.1]} position={[0, 1.2, 0]} castShadow>
            <meshStandardMaterial color={car.battery > 50 ? "#22c55e" : car.battery > 20 ? "#f59e0b" : "#ef4444"} />
          </Box>

          {/* Car Status Display */}
          <Text position={[0, 1.8, 0]} fontSize={0.2} color="#1e40af" anchorX="center" anchorY="middle">
            {`Obo Car | Battery: ${car.battery.toFixed(0)}% | ${isRunning ? "ACTIVE" : "READY"}`}
          </Text>

          {/* Direction Indicator Arrow */}
          <Box args={[0.5, 0.05, 0.1]} position={[1.2, 0.8, 0]} castShadow>
            <meshStandardMaterial color={isRunning ? "#ef4444" : "#6b7280"} />
          </Box>
        </group>
      </RigidBody>

      {/* Dynamic Obstacles */}
      {obstacles.map((obstacle) => (
        <RigidBody key={obstacle.id} position={obstacle.position} colliders="cuboid" type="fixed">
          <Box args={obstacle.size} castShadow>
            <meshStandardMaterial color={obstacle.color} />
          </Box>
          <Text
            position={[0, obstacle.size[1] + 0.5, 0]}
            fontSize={0.15}
            color={obstacle.color}
            anchorX="center"
            anchorY="middle"
          >
            {obstacle.id}
          </Text>
        </RigidBody>
      ))}

      {/* Start Position Marker */}
      <Cylinder args={[0.5, 0.5, 0.1]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#22c55e" transparent opacity={0.5} />
      </Cylinder>
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.2}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        START
      </Text>

      {/* Coordinate System Reference */}
      <group position={[8, 0.1, 8]}>
        <Box args={[2, 0.05, 0.05]} position={[1, 0, 0]}>
          <meshStandardMaterial color="#ef4444" />
        </Box>
        <Box args={[0.05, 0.05, 2]} position={[0, 0, 1]}>
          <meshStandardMaterial color="#3b82f6" />
        </Box>
        <Text position={[2.2, 0, 0]} fontSize={0.3} color="#ef4444">
          X
        </Text>
        <Text position={[0, 0, 2.2]} fontSize={0.3} color="#3b82f6">
          Z
        </Text>
      </group>
    </>
  )
}
