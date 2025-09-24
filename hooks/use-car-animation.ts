import { useRef, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore, AnimationState } from '@/lib/simulation-store'

// Define RigidBodyApi interface based on what we need
interface RigidBodyApi {
  setTranslation: (translation: { x: number; y: number; z: number } | THREE.Vector3, wakeUp?: boolean) => void
  setRotation: (rotation: THREE.Quaternion, wakeUp?: boolean) => void
  setLinvel: (velocity: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  setAngvel: (velocity: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  applyImpulse: (impulse: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  applyTorqueImpulse: (torque: { x: number; y: number; z: number }, wakeUp?: boolean) => void
  translation: () => { x: number; y: number; z: number }
  rotation: () => { x: number; y: number; z: number; w: number }
  linvel: () => { x: number; y: number; z: number }
  angvel: () => { x: number; y: number; z: number }
}

interface CarAnimationHookProps {
  carRef: React.RefObject<RigidBodyApi>
}

export function useCarAnimation({ carRef }: CarAnimationHookProps) {
  const animationStartTime = useRef<number>(0)
  const lastPosition = useRef(new THREE.Vector3())
  const lastRotation = useRef(new THREE.Euler())
  
  const {
    carPhysics,
    carAnimation,
    isRunning,
    currentCommand,
    setAnimationState,
    updateCarPhysics,
    updateMetrics
  } = useSimulationStore()

  // Initialize car position
  useEffect(() => {
    if (carRef.current && !isRunning) {
      carRef.current.setTranslation(carPhysics.position, true)
      carRef.current.setRotation(
        new THREE.Quaternion().setFromEuler(carPhysics.rotation),
        true
      )
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  }, [isRunning, carRef])

  // Animation state machine logic
  const processAnimationState = useCallback(() => {
    if (!carRef.current || !isRunning) return

    const rigidBody = carRef.current
    const currentPos = rigidBody.translation()
    const currentRot = rigidBody.rotation()
    
    // Update physics state from actual 3D position
    updateCarPhysics({
      position: new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
      rotation: new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w)
      )
    })

    switch (carAnimation.currentState) {
      case AnimationState.MOVING_FORWARD:
        applyForwardMovement(rigidBody)
        break
      case AnimationState.MOVING_BACKWARD:
        applyBackwardMovement(rigidBody)
        break
      case AnimationState.TURNING_LEFT:
        applyLeftTurn(rigidBody)
        break
      case AnimationState.TURNING_RIGHT:
        applyRightTurn(rigidBody)
        break
      case AnimationState.STOPPING:
        applyBraking(rigidBody)
        break
      case AnimationState.ACCELERATING:
        applyAcceleration(rigidBody)
        break
      case AnimationState.DECELERATING:
        applyDeceleration(rigidBody)
        break
      case AnimationState.IDLE:
        // Gradually stop the car
        const currentVel = rigidBody.linvel()
        if (Math.abs(currentVel.x) > 0.1 || Math.abs(currentVel.z) > 0.1) {
          rigidBody.setLinvel({
            x: currentVel.x * 0.95,
            y: currentVel.y,
            z: currentVel.z * 0.95
          }, true)
        }
        break
    }

    // Update metrics
    updateMetrics()
  }, [carRef, isRunning, carAnimation.currentState, updateCarPhysics, updateMetrics])

  // Physics movement functions
  const applyForwardMovement = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    const force = (currentCommand.value || 1) * carPhysics.mass * 0.5
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(new THREE.Quaternion().setFromEuler(carPhysics.rotation))
    
    rigidBody.applyImpulse({
      x: direction.x * force,
      y: 0,
      z: direction.z * force
    }, true)
    
    // Apply speed limiting
    const velocity = rigidBody.linvel()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    if (speed > carPhysics.maxSpeed) {
      const factor = carPhysics.maxSpeed / speed
      rigidBody.setLinvel({
        x: velocity.x * factor,
        y: velocity.y,
        z: velocity.z * factor
      }, true)
    }
  }

  const applyBackwardMovement = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    const force = (currentCommand.value || 1) * carPhysics.mass * 0.5
    const direction = new THREE.Vector3(0, 0, 1)
    direction.applyQuaternion(new THREE.Quaternion().setFromEuler(carPhysics.rotation))
    
    rigidBody.applyImpulse({
      x: direction.x * force,
      y: 0,
      z: direction.z * force
    }, true)
  }

  const applyLeftTurn = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    const torque = (currentCommand.value || 90) * 0.01
    rigidBody.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true)
    
    // Limit angular velocity
    const angVel = rigidBody.angvel()
    if (Math.abs(angVel.y) > carPhysics.maxTurnSpeed) {
      const sign = Math.sign(angVel.y)
      rigidBody.setAngvel({
        x: angVel.x,
        y: sign * carPhysics.maxTurnSpeed,
        z: angVel.z
      }, true)
    }
  }

  const applyRightTurn = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    const torque = (currentCommand.value || 90) * 0.01
    rigidBody.applyTorqueImpulse({ x: 0, y: -torque, z: 0 }, true)
    
    // Limit angular velocity
    const angVel = rigidBody.angvel()
    if (Math.abs(angVel.y) > carPhysics.maxTurnSpeed) {
      const sign = Math.sign(angVel.y)
      rigidBody.setAngvel({
        x: angVel.x,
        y: sign * carPhysics.maxTurnSpeed,
        z: angVel.z
      }, true)
    }
  }

  const applyBraking = (rigidBody: RigidBodyApi) => {
    const velocity = rigidBody.linvel()
    const angularVelocity = rigidBody.angvel()
    
    // Apply strong damping
    rigidBody.setLinvel({
      x: velocity.x * 0.8,
      y: velocity.y,
      z: velocity.z * 0.8
    }, true)
    
    rigidBody.setAngvel({
      x: angularVelocity.x * 0.8,
      y: angularVelocity.y * 0.8,
      z: angularVelocity.z * 0.8
    }, true)
    
    // Check if car has stopped
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    if (speed < 0.1 && Math.abs(angularVelocity.y) < 0.1) {
      setAnimationState(AnimationState.IDLE)
    }
  }

  const applyAcceleration = (rigidBody: RigidBodyApi) => {
    const currentVel = rigidBody.linvel()
    const speed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z)
    
    if (speed < carPhysics.maxSpeed * 0.8) {
      setAnimationState(AnimationState.MOVING_FORWARD)
    }
  }

  const applyDeceleration = (rigidBody: RigidBodyApi) => {
    const currentVel = rigidBody.linvel()
    const speed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z)
    
    if (speed < carPhysics.maxSpeed * 0.2) {
      setAnimationState(AnimationState.IDLE)
    } else {
      rigidBody.setLinvel({
        x: currentVel.x * 0.95,
        y: currentVel.y,
        z: currentVel.z * 0.95
      }, true)
    }
  }

  // Use frame to update animation
  useFrame((state, delta) => {
    processAnimationState()
  })

  // Handle state transitions based on commands
  useEffect(() => {
    if (!currentCommand || !isRunning) return

    switch (currentCommand.type) {
      case 'forward':
        if (carAnimation.currentState === AnimationState.IDLE) {
          setAnimationState(AnimationState.MOVING_FORWARD)
        }
        break
      case 'backward':
        if (carAnimation.currentState === AnimationState.IDLE) {
          setAnimationState(AnimationState.MOVING_BACKWARD)
        }
        break
      case 'turn_left':
        if (carAnimation.currentState === AnimationState.IDLE ||
            carAnimation.currentState === AnimationState.MOVING_FORWARD) {
          setAnimationState(AnimationState.TURNING_LEFT)
        }
        break
      case 'turn_right':
        if (carAnimation.currentState === AnimationState.IDLE ||
            carAnimation.currentState === AnimationState.MOVING_FORWARD) {
          setAnimationState(AnimationState.TURNING_RIGHT)
        }
        break
      case 'stop':
        setAnimationState(AnimationState.STOPPING)
        break
    }
  }, [currentCommand, carAnimation.currentState, isRunning, setAnimationState])

  return {
    animationState: carAnimation.currentState,
    isTransitioning: carAnimation.isTransitioning,
    animationProgress: carAnimation.animationProgress
  }
}