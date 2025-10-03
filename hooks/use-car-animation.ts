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
  // Refs must be declared first and consistently
  const animationStartTime = useRef<number>(0)
  const lastPosition = useRef(new THREE.Vector3())
  const lastRotation = useRef(new THREE.Euler())
  const idlePositionRef = useRef<{x: number; y: number; z: number} | null>(null)
  const lastStateChange = useRef<number>(Date.now())
  const pendingStateChange = useRef<{state: AnimationState, time: number} | null>(null)
  const pendingCommand = useRef<string | null>(null);
  const lastDriftCorrectionTime = useRef<number>(0); // Track when we last corrected drift
  const lastInitialization = useRef<string>('');
  const isInitialized = useRef<boolean>(false)
  
  // Store hooks must be called consistently
  const {
    carPhysics,
    carAnimation,
    isRunning,
    currentCommand,
    setAnimationState,
    updateCarPhysics,
    updateMetrics
  } = useSimulationStore()
  
  // Function to safely change animation state with cooldown protection
  const safeSetAnimationState = useCallback((newState: AnimationState) => {
    const now = Date.now();
    const timeSinceLastChange = now - lastStateChange.current;
    
    // If trying to change state too quickly, queue it instead
    if (timeSinceLastChange < 400) {
      //console.log(`State change to ${newState} too soon (${timeSinceLastChange}ms), queueing instead`);
      pendingStateChange.current = { state: newState, time: now };
      return;
    }
    
    console.log(`Safe state transition to: ${newState}`);
    lastStateChange.current = now;
    setAnimationState(newState);
    
    // If changing to IDLE, remember position to detect drift
    if (newState === AnimationState.IDLE && carRef.current) {
      const pos = carRef.current.translation();
      idlePositionRef.current = { x: pos.x, y: pos.y, z: pos.z };
    }
  }, [setAnimationState, carRef]);
  
  // Process any pending state changes on a regular interval
  useEffect(() => {
    const processPendingStateChanges = () => {
      if (!pendingStateChange.current) return;
      
      const now = Date.now();
      const timeSinceRequest = now - pendingStateChange.current.time;
      const timeSinceLastChange = now - lastStateChange.current;
      
      // If enough time has passed since last change, apply the pending state
      if (timeSinceLastChange >= 400) {
        console.log(`Applying queued state change to ${pendingStateChange.current.state} after ${timeSinceRequest}ms`);
        safeSetAnimationState(pendingStateChange.current.state);
        pendingStateChange.current = null;
      }
    };
    
    const interval = setInterval(processPendingStateChanges, 100);
    return () => clearInterval(interval);
  }, [safeSetAnimationState]);

  // Initialize car position with current rotation from the store
  useEffect(() => {
    if (carRef.current) {
      // Get current car positions
      const rigidBodyPos = carRef.current.translation();
      const hasMovedFromOrigin = 
        Math.abs(rigidBodyPos.x) > 0.1 || 
        Math.abs(rigidBodyPos.z) > 0.1;
      
      // CRITICAL: Only set the car's position on first initialization
      // or if the car hasn't moved from origin yet
      if (!isInitialized.current || !hasMovedFromOrigin) {
        console.log('Initializing car position from store');
        carRef.current.setTranslation(carPhysics.position, true);
        
        // Store this as our initial idle position
        idlePositionRef.current = { 
          x: carPhysics.position.x, 
          y: carPhysics.position.y, 
          z: carPhysics.position.z 
        };
        console.log('Initialized idle position reference:', idlePositionRef.current);
      } else {
        // If the car has moved, use its current position as the source of truth
        // but update the physics store to match it
        if (hasMovedFromOrigin && isInitialized.current) {
          console.log('Car has moved, preserving RigidBody position:', rigidBodyPos);
          
          // Update the store to match the RigidBody position
          const newPos = new THREE.Vector3(rigidBodyPos.x, rigidBodyPos.y, rigidBodyPos.z);
          if (!newPos.equals(carPhysics.position)) {
            console.log('Updating store position to match RigidBody');
            updateCarPhysics({
              position: newPos
            });
          }
        }
      }
      
      // Set the rotation from the physics store to maintain correct rotation
      const storeRotation = new THREE.Quaternion().setFromEuler(carPhysics.rotation)
      carRef.current.setRotation(storeRotation, true)
      
      // Zero out velocities to prevent unwanted movement
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      
      // Mark as initialized
      isInitialized.current = true;
    }
  }, [isRunning, carRef, carPhysics.position, carPhysics.rotation, updateCarPhysics])

  // Log rotation data every 3 seconds for debugging
  useEffect(() => {
    if (!isRunning) return
    
    const rotationLogInterval = setInterval(() => {
      if (carRef.current) {
        const currentRot = carRef.current.rotation()
        const storeRot = carPhysics.rotation
        console.log(`Car rotation data - Physics: ${(storeRot.y * 180 / Math.PI).toFixed(1)}°, RigidBody: [${currentRot.x.toFixed(2)}, ${currentRot.y.toFixed(2)}, ${currentRot.z.toFixed(2)}, ${currentRot.w.toFixed(2)}]`)
      }
    }, 3000)
    
    return () => clearInterval(rotationLogInterval)
  }, [isRunning, carRef, carPhysics.rotation])

  // Animation state machine logic
  const processAnimationState = useCallback(() => {
    if (!carRef.current || !isRunning) return

    const rigidBody = carRef.current
    const currentPos = rigidBody.translation()
    const currentRot = rigidBody.rotation()
    
    // Update physics state from actual 3D position
    // IMPORTANT: Keep the X position synchronized to prevent jumps
    const currentStorePos = carPhysics.position;
    
    // Only update if there's a significant difference to avoid constant micro-adjustments
    if (
      Math.abs(currentPos.x - currentStorePos.x) > 0.05 ||
      Math.abs(currentPos.y - currentStorePos.y) > 0.05 ||
      Math.abs(currentPos.z - currentStorePos.z) > 0.05
    ) {
      updateCarPhysics({
        position: new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
        rotation: new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w)
        )
      });
    }

    switch (carAnimation.currentState) {
      case AnimationState.MOVING_FORWARD:
        applyForwardMovement(rigidBody)
        break
      case AnimationState.MOVING_BACKWARD:
        applyBackwardMovement(rigidBody)
        break
      // Apply rotation based on animation state
      case AnimationState.TURNING_LEFT:
        applyLeftRotation(rigidBody)
        break
      case AnimationState.TURNING_RIGHT:
        applyRightRotation(rigidBody)
        break
      case AnimationState.STOPPING:
        applyBraking(rigidBody)
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
    
    // Check if command has been running for its duration
    if (currentCommand.startTime) {
      const elapsedTime = Date.now() - currentCommand.startTime
      if (elapsedTime >= (currentCommand.duration || 1000)) {
        // Command duration is over, stop the car completely
        console.log('Forward command duration complete - stopping car')
        
        // Cancel any momentum by immediately setting velocity to zero
        rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Fix the position to prevent further movement
        const pos = rigidBody.translation();
        rigidBody.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
        
        // Double-check velocity is really zero
        const vel = rigidBody.linvel();
        if (Math.abs(vel.z) > 0.001) {
          console.log('Forward velocity not zero after stop command, forcing again:', vel.z);
          rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        
        safeSetAnimationState(AnimationState.STOPPING);
        
        // Add a delayed final check and stop
        setTimeout(() => {
          if (carRef.current) {
            carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }
        }, 50);
        
        return;
      }
    }
    
    const force = (currentCommand.value || 1) * carPhysics.mass * 0.5;
    
    // Calculate the exact distance to move
    const targetDistance = currentCommand.value || 1;
    
    // Force the car to move in a straight line (fixed forward direction)
    rigidBody.applyImpulse({
      x: 0,
      y: 0,
      z: -force // Negative Z is forward
    }, true);
    
    // Apply speed limiting
    const velocity = rigidBody.linvel();
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (speed > carPhysics.maxSpeed) {
      const factor = carPhysics.maxSpeed / speed;
      rigidBody.setLinvel({
        x: 0, // Force X velocity to be 0 to maintain straight line
        y: velocity.y,
        z: velocity.z * factor
      }, true);
    }
    
    // Ensure Z velocity is negative for forward movement
    if (velocity.z > 0) {
      console.log('Correcting positive Z velocity during forward movement:', velocity.z);
      rigidBody.setLinvel({
        x: 0,
        y: velocity.y,
        z: -Math.abs(velocity.z)
      }, true);
    }
  }

  const applyBackwardMovement = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    // Log that we're in backward movement mode
    console.log(`Applying backward movement, command:`, currentCommand);
    
    // Check if command has been running for its duration
    if (currentCommand.startTime) {
      const elapsedTime = Date.now() - currentCommand.startTime
      if (elapsedTime >= (currentCommand.duration || 1000)) {
        // Command duration is over, stop the car completely
        console.log('Backward command duration complete - stopping car')
        
        // Cancel any momentum by immediately setting velocity to zero
        rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Fix the position to prevent further movement
        const pos = rigidBody.translation();
        rigidBody.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
        
        // Double-check velocity is really zero
        const vel = rigidBody.linvel();
        if (Math.abs(vel.z) > 0.001) {
          console.log('Backward velocity not zero after stop command, forcing again:', vel.z);
          rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        
        safeSetAnimationState(AnimationState.STOPPING);
        
        // Add a delayed final check and stop
        setTimeout(() => {
          if (carRef.current) {
            carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }
        }, 50);
        
        return;
      }
    }
    
    // Make sure we have a positive value for the force calculation
    const absValue = Math.abs(currentCommand.value || 1);
    const force = absValue * carPhysics.mass * 0.3; // Reduced force for more controlled movement
    
    // Log current position and velocity before applying force
    const posBeforeForce = rigidBody.translation();
    const velBeforeForce = rigidBody.linvel();
    console.log(`Before applying backward force: pos=[${posBeforeForce.x}, ${posBeforeForce.y}, ${posBeforeForce.z}], vel=[${velBeforeForce.x}, ${velBeforeForce.y}, ${velBeforeForce.z}]`);
    
    // Check if current Z position is positive (meaning car has moved forward)
    if (posBeforeForce.z < 0) {
      // Car is already in the positive Z direction (moved forward), so backward means moving towards 0
      // Force the car to move in a straight line towards the origin
      rigidBody.applyImpulse({
        x: 0,
        y: 0,
        z: force // Positive Z is backward from forward position
      }, true);
    } else {
      // Car is at or behind the origin, so backward means negative Z
      // This handles the case where car.backward() is called from the origin
      rigidBody.applyImpulse({
        x: 0,
        y: 0,
        z: force // Still use positive Z force as backward
      }, true);
    }
    
    // Log after applying force
    const velAfterForce = rigidBody.linvel();
    console.log(`After applying backward force: vel=[${velAfterForce.x}, ${velAfterForce.y}, ${velAfterForce.z}]`);
    
    // Apply speed limiting
    const velocity = rigidBody.linvel();
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (speed > carPhysics.maxSpeed * 0.8) { // Slightly lower speed for backward movement
      const factor = (carPhysics.maxSpeed * 0.8) / speed;
      rigidBody.setLinvel({
        x: 0, // Force X velocity to be 0 to maintain straight line
        y: velocity.y,
        z: velocity.z * factor
      }, true);
    }
    
    // Ensure Z velocity is positive for backward movement
    if (velocity.z < 0) {
      console.log('Correcting negative Z velocity during backward movement:', velocity.z);
      rigidBody.setLinvel({
        x: 0,
        y: velocity.y,
        z: Math.abs(velocity.z)
      }, true);
      
      // Double check the correction worked
      const correctedVel = rigidBody.linvel();
      console.log(`After Z-velocity correction: vel=[${correctedVel.x}, ${correctedVel.y}, ${correctedVel.z}]`);
    }
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

  const applyLeftRotation = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    // Check if command has been running for its duration
    if (currentCommand.startTime) {
      const elapsedTime = Date.now() - currentCommand.startTime
      if (elapsedTime >= (currentCommand.duration || 1000)) {
        // Command duration is over, stop the rotation
        console.log('Left rotation command duration complete')
        
        // Stop rotation immediately
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
        
        // Apply the final rotation based on the store physics state
        const targetRotation = new THREE.Quaternion().setFromEuler(carPhysics.rotation)
        rigidBody.setRotation(targetRotation, true)
        
        // Force a snapshot of the final angle into the physics state
        const angle = carPhysics.rotation.y * (180 / Math.PI)
        console.log(`Final left rotation angle: ${angle.toFixed(1)}°`)
        
        safeSetAnimationState(AnimationState.IDLE)
        return
      }
    }
    
    // For faster response, directly apply the rotation instead of using physics
    // Calculate how much to rotate based on the command duration and elapsed time
    const rotationAmount = (currentCommand?.value || 90)
    const radians = (rotationAmount * Math.PI / 180) 
    
    // Get current rotation
    const currentRot = rigidBody.rotation()
    
    // Convert to THREE quaternion
    const currentQuaternion = new THREE.Quaternion(
      currentRot.x, currentRot.y, currentRot.z, currentRot.w
    )
    
    // Create a new euler from the quaternion
    const euler = new THREE.Euler().setFromQuaternion(currentQuaternion)
    euler.y += radians * 0.1  // Apply 10% of the total rotation per frame
    const newRotation = new THREE.Quaternion().setFromEuler(euler)
    
    // Apply the rotation
    rigidBody.setRotation(newRotation, true)
  }
  
  const applyRightRotation = (rigidBody: RigidBodyApi) => {
    if (!currentCommand) return
    
    // Check if command has been running for its duration
    if (currentCommand.startTime) {
      const elapsedTime = Date.now() - currentCommand.startTime
      if (elapsedTime >= (currentCommand.duration || 1000)) {
        // Command duration is over, stop the rotation
        console.log('Right rotation command duration complete')
        
        // Stop rotation immediately
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
        
        // Apply the final rotation based on the store physics state
        const targetRotation = new THREE.Quaternion().setFromEuler(carPhysics.rotation)
        rigidBody.setRotation(targetRotation, true)
        
        // Force a snapshot of the final angle into the physics state
        const angle = carPhysics.rotation.y * (180 / Math.PI)
        console.log(`Final right rotation angle: ${angle.toFixed(1)}°`)
        
        safeSetAnimationState(AnimationState.IDLE)
        return
      }
    }
    
    // For faster response, directly apply the rotation instead of using physics
    // Calculate how much to rotate based on the command duration and elapsed time
    const rotationAmount = (currentCommand?.value || 90)
    const radians = (rotationAmount * Math.PI / 180) 
    
    // Get current rotation
    const currentRot = rigidBody.rotation()
    
    // Convert to THREE quaternion
    const currentQuaternion = new THREE.Quaternion(
      currentRot.x, currentRot.y, currentRot.z, currentRot.w
    )
    
    // Create a new euler from the quaternion
    const euler = new THREE.Euler().setFromQuaternion(currentQuaternion)
    euler.y -= radians * 0.1  // Apply 10% of the total rotation per frame (negative for right turn)
    const newRotation = new THREE.Quaternion().setFromEuler(euler)
    
    // Apply the rotation
    rigidBody.setRotation(newRotation, true)
  }
  
  const applyBraking = (rigidBody: RigidBodyApi) => {
    console.log('Applying braking - stopping car completely')
    
    // Capture current position before applying any changes
    const pos = rigidBody.translation();
    
    // Immediately stop the car instead of gradual braking
    // This ensures the car stops exactly when a command completes
    rigidBody.setLinvel({
      x: 0,
      y: 0,
      z: 0
    }, true);
    
    rigidBody.setAngvel({
      x: 0,
      y: 0,
      z: 0
    }, true);
    
    // Make sure position doesn't change during braking
    rigidBody.setTranslation({
      x: pos.x,
      y: pos.y,
      z: pos.z
    }, true);
    
    // Store the idle position for reference
    idlePositionRef.current = { x: pos.x, y: pos.y, z: pos.z };
    
    // Double-check that velocity is actually zero
    const vel = rigidBody.linvel();
    if (Math.abs(vel.x) > 0.001 || Math.abs(vel.y) > 0.001 || Math.abs(vel.z) > 0.001) {
      console.log('Velocity not zero after braking, forcing again:', vel);
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    
    // Add a small delay before forcing animation state to IDLE
    // This helps ensure physics calculations have settled
    setTimeout(() => {
      // Check if we're still in the STOPPING state before transitioning
      if (carAnimation.currentState === AnimationState.STOPPING) {
        safeSetAnimationState(AnimationState.IDLE);
        
        // Final safety check to ensure the car is completely stopped
        if (carRef.current) {
          carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    }, 100);
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

  // Use frame to update animation and enforce movement rules
  useFrame((state, delta) => {
    // Early return if carRef is not available or not initialized
    if (!carRef.current || !isInitialized.current) {
      return
    }
    
    // Process the current animation state
    processAnimationState()
    
    // CRITICAL FIX: Only zero angular velocity when NOT actively rotating
    // This prevents fighting with the rotation animation system
    const isActivelyRotating = carAnimation.currentState === AnimationState.TURNING_LEFT || 
                              carAnimation.currentState === AnimationState.TURNING_RIGHT
    
    if (carRef.current && !isActivelyRotating) {
      // Only zero angular velocity when the car should be stationary
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
    
    if (carRef.current) {
      // Get current position and velocity
      const pos = carRef.current.translation()
      const vel = carRef.current.linvel()
      
      // IMPORTANT: Only enforce X position for active movement states, not IDLE
      // This allows the car to have non-zero X positions when commands complete
      if ((carAnimation.currentState === AnimationState.MOVING_FORWARD || 
           carAnimation.currentState === AnimationState.MOVING_BACKWARD) &&
           (Math.abs(vel.x) > 0.01)) {
        // Only zero out the X velocity, not position
        carRef.current.setLinvel({ x: 0, y: vel.y, z: vel.z }, true)
      }
      
      // CRITICAL FIX: Use rotation from physics store, but DON'T override during active rotation
      // This prevents conflicts between the animation system and frame-by-frame updates
      
      if (!isActivelyRotating) {
        // Only apply stored rotation when not actively rotating
        const storeRotation = new THREE.Quaternion().setFromEuler(carPhysics.rotation)
        const currentRotation = carRef.current.rotation()
        const currentQuat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w)
        
        // Only update if there's a significant difference to avoid micro-adjustments
        const rotationDiff = storeRotation.angleTo(currentQuat)
        if (rotationDiff > 0.01) { // Only update if difference is > ~0.57 degrees
          carRef.current.setRotation(storeRotation, true)
        }
      }
      // If actively rotating, let the animation system handle rotation completely
      
      // Check if we should force stop the car
      // This ensures the car stops completely between commands
      if (!currentCommand && carAnimation.currentState !== AnimationState.IDLE) {
        // No active command but car is still moving - force it to stop
        console.log('No active command but car is not IDLE - forcing stop')
        carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        safeSetAnimationState(AnimationState.IDLE)
      }
      
      // Enhanced STOPPING state handling with more aggressive stopping mechanism
      if (carAnimation.currentState === AnimationState.STOPPING) {
        // Check if velocity is already zero
        const velocity = carRef.current.linvel();
        const isAlreadyStopped = 
          Math.abs(velocity.x) < 0.001 && 
          Math.abs(velocity.y) < 0.001 && 
          Math.abs(velocity.z) < 0.001;
        
        // Only transition to IDLE if enough time has passed since last state change
        // This prevents rapid cycling between states
        const now = Date.now();
        const timeSinceLastStateChange = now - lastStateChange.current;
        
        // More aggressive stopping - absolutely force the car to stay in place
        const pos = carRef.current.translation();
        carRef.current.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
        carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        if (isAlreadyStopped && timeSinceLastStateChange > 400) { // Increased cooldown time
          console.log('Car in STOPPING state and velocity is zero - transitioning to IDLE');
          
          // Queue the state change with a small delay to ensure physics stabilizes first
          setTimeout(() => {
            if (carRef.current) {
              // Final velocity and position reset before changing state
              carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
              
              const currentPos = carRef.current.translation();
              carRef.current.setTranslation({ 
                x: currentPos.x, 
                y: currentPos.y, 
                z: currentPos.z 
              }, true);
              
              // Update the state using our safe method
              safeSetAnimationState(AnimationState.IDLE);
              
              // Record initial position for the IDLE state
              idlePositionRef.current = { 
                x: currentPos.x, 
                y: currentPos.y, 
                z: currentPos.z 
              };
            }
          }, 50);
        } else {
          // Not fully stopped yet or not enough time has passed
          if (!isAlreadyStopped) {
            console.log('Car in STOPPING state - forcing complete stop');
            
            // Multiple redundant stop commands to ensure physics engine complies
            carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            
            // Schedule another check just to be extra sure
            setTimeout(() => {
              if (carRef.current) {
                carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              }
            }, 20);
          } else if (timeSinceLastStateChange <= 400) {
            console.log('Waiting for extended cooldown before transitioning to IDLE');
          }
        }
      }
      
      // Enhanced failsafe: if car is in IDLE state but still has velocity or has moved from its idle position
      if (carAnimation.currentState === AnimationState.IDLE) {
        const velocity = carRef.current.linvel();
        const currPos = carRef.current.translation();
        
        // Check for unexpected velocity (only fix extreme cases)
        // Use much higher thresholds to only catch dramatic issues
        const hasUnexpectedVelocity = Math.abs(velocity.x) > 0.5 || 
                                     Math.abs(velocity.y) > 0.5 || 
                                     Math.abs(velocity.z) > 5.0; // Much higher threshold to avoid interference
        
        // Check if the car has drifted dramatically from physics store position
        let hasDramaticDrift = false;
        const storePos = carPhysics.position;
        const driftFromStoreX = Math.abs(currPos.x - storePos.x);
        const driftFromStoreY = Math.abs(currPos.y - storePos.y);
        const driftFromStoreZ = Math.abs(currPos.z - storePos.z);
        
        // Only consider dramatic drift (values much higher than before)
        hasDramaticDrift = driftFromStoreX > 1.0 || driftFromStoreY > 1.0 || driftFromStoreZ > 1.0; // Lower Z threshold
        
        // Only log significant drifts
        if (hasDramaticDrift) {
          console.log(`DRAMATIC car drift detected! Store: (${storePos.x.toFixed(2)},${storePos.y.toFixed(2)},${storePos.z.toFixed(2)}), RigidBody: (${currPos.x.toFixed(2)},${currPos.y.toFixed(2)},${currPos.z.toFixed(2)})`);
        }
        
        // Special case: if the X coordinate is exactly 0 but should be non-zero according to store
        // This catches the issue when X is reset to zero incorrectly after a command sequence
        const isXResetToZero = Math.abs(currPos.x) < 0.01 && Math.abs(storePos.x) > 0.1;
        
        // Throttle corrections with even longer interval
        const now = Date.now();
        const timeSinceLastCorrection = now - lastDriftCorrectionTime.current;
        const shouldApplyCorrection = timeSinceLastCorrection > 1000; // Shorter interval for more responsive correction
        
        // Immediately fix the X=0 case, otherwise use normal rules
        if ((isXResetToZero || hasUnexpectedVelocity || hasDramaticDrift) && shouldApplyCorrection) {
          if (isXResetToZero) {
            console.log(`🚨 Critical issue: X coordinate reset to 0 when it should be ${storePos.x.toFixed(2)} - fixing immediately`);
          } else {
            console.log('Fixing extreme physics issues - this should be rare');
          }
          
          lastDriftCorrectionTime.current = now;
          
          // Reset velocity
          carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          
          // Get the car position from the store - this is the authoritative position
          const storePosition = carPhysics.position.clone();
          const storeRotation = new THREE.Quaternion().setFromEuler(carPhysics.rotation);
          
          // Use the position from the store (simulation-store.ts) as source of truth
          carRef.current.setTranslation({
            x: storePosition.x,
            y: storePosition.y, 
            z: storePosition.z
          }, true);
            
          // Apply rotation from the store
          carRef.current.setRotation(storeRotation, true);
          
          // Double-check that the position was applied correctly
          setTimeout(() => {
            if (carRef.current) {
              const newPos = carRef.current.translation();
              if (Math.abs(newPos.x - storePosition.x) > 0.1) {
                console.log(`🚨 Position correction failed! Trying again. Expected X: ${storePosition.x.toFixed(2)}, Got: ${newPos.x.toFixed(2)}`);
                carRef.current.setTranslation({
                  x: storePosition.x,
                  y: storePosition.y, 
                  z: storePosition.z
                }, true);
              }
            }
          }, 50);
          
          // Update idle position reference to match store
          idlePositionRef.current = { 
            x: storePosition.x, 
            y: storePosition.y, 
            z: storePosition.z 
          };
          
          // Update physics state to ensure consistency
          updateCarPhysics({
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0)
          });
          
          // Schedule an additional check to make sure velocity remains at zero
          setTimeout(() => {
            if (carRef.current && carAnimation.currentState === AnimationState.IDLE) {
              carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            }
          }, 50);
        }
      }
    }
  })

  // We're using the already declared lastStateChange and pendingCommand refs
  
  // Handle state transitions based on commands
  useEffect(() => {
    if (!isRunning) return;
    
    const now = Date.now();
    
    // Don't allow state transitions too frequently to prevent cycling
    if (now - lastStateChange.current < 300) {
      console.log('Preventing rapid state transition');
      return;
    }
    
    if (!currentCommand) {
      // No active command - ensure car is in IDLE state
      if (carAnimation.currentState !== AnimationState.IDLE) {
        console.log('No active command - setting car to IDLE state')
        
        // Make sure car is completely stopped
        if (carRef.current) {
          carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
          carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
        }
        
        safeSetAnimationState(AnimationState.IDLE)
      }
      return;
    }

    // If we're stopping, don't start a new movement until fully stopped
    if (carAnimation.currentState === AnimationState.STOPPING) {
      console.log('Car is currently stopping - waiting to complete before new commands');
      // Store the command for execution after stopping completes
      pendingCommand.current = currentCommand.type;
      return;
    }

    // If we have a pending command and we're now IDLE, execute it
    if (pendingCommand.current && carAnimation.currentState === AnimationState.IDLE) {
      const cmd = pendingCommand.current;
      pendingCommand.current = null;
      
      // Apply the pending command
      if (cmd === 'forward') {
        console.log('Executing pending forward command');
        safeSetAnimationState(AnimationState.MOVING_FORWARD);
      } else if (cmd === 'backward') {
        console.log('Executing pending backward command');
        safeSetAnimationState(AnimationState.MOVING_BACKWARD);
      }
      return;
    }

    // Process new command
    switch (currentCommand.type) {
      case 'forward':
        if (carAnimation.currentState === AnimationState.IDLE) {
          console.log('Starting forward movement')
          safeSetAnimationState(AnimationState.MOVING_FORWARD)
        }
        break
      case 'backward':
        if (carAnimation.currentState === AnimationState.IDLE) {
          console.log('Starting backward movement')
          safeSetAnimationState(AnimationState.MOVING_BACKWARD)
        }
        break
      // Ignore turn commands
      case 'turn_left':
      case 'turn_right':
        // Do nothing - turns are disabled
        break
      case 'stop':
        console.log('Processing stop command')
        safeSetAnimationState(AnimationState.STOPPING)
        break
    }
  }, [currentCommand, carAnimation.currentState, isRunning, setAnimationState])

  return {
    animationState: carAnimation.currentState,
    isTransitioning: carAnimation.isTransitioning,
    animationProgress: carAnimation.animationProgress
  }
}