import { Scene, AbstractMesh, ArcRotateCamera } from '@babylonjs/core';
import { CarState } from './types';

interface RenderLoopParams {
  scene: Scene;
  car: AbstractMesh;
  carState: CarState;
  physicsManager: any;
  camera: ArcRotateCamera | null;
  leftWheels: AbstractMesh[];
  rightWheels: AbstractMesh[];
  frontWheel: AbstractMesh | null;
}

export function updateCarWithPhysics(params: RenderLoopParams): void {
  const { car, carState, physicsManager, camera } = params;
  
  physicsManager.applyMotorTorque(
    carState.leftMotorSpeed * carState.leftMotorDirection,
    carState.rightMotorSpeed * carState.rightMotorDirection
  );

  physicsManager.updateWheelRotation();
  physicsManager.constrainCarHeight();

  const physicsPos = physicsManager.getCarPosition();
  const physicsRot = physicsManager.getCarRotation();
  
  car.position = physicsPos;
  car.rotationQuaternion = physicsRot;

  if (camera) {
    camera.target = physicsPos.clone();
  }
}

export function updateCarKinematic(params: RenderLoopParams): void {
  const { car, carState, leftWheels, rightWheels, frontWheel } = params;
  
  const leftSpeed = (carState.leftMotorSpeed / 512) * carState.leftMotorDirection;
  const rightSpeed = (carState.rightMotorSpeed / 512) * carState.rightMotorDirection;
  
  const avgSpeed = (leftSpeed + rightSpeed) / 2;
  const turnRate = rightSpeed - leftSpeed;
  const moveSpeed = avgSpeed * 0.1;
  const turnSpeed = turnRate * 0.15;
  
  const rotationAxis = (car as any).wheelRotationAxis || 'z';
  
  // Rotate wheels - left wheels negated due to model geometry, right wheels normal
  // Left wheels - negate to match right wheel direction
  leftWheels.forEach((wheel) => {
    if (wheel) {
      if (rotationAxis === 'x') wheel.rotation.x -= leftSpeed * 0.2;
      else if (rotationAxis === 'y') wheel.rotation.y -= leftSpeed * 0.2;
      else wheel.rotation.z -= leftSpeed * 0.2;
    }
  });
  
  // Right wheels - use normal formula
  rightWheels.forEach((wheel) => {
    if (wheel) {
      if (rotationAxis === 'x') wheel.rotation.x += rightSpeed * 0.2;
      else if (rotationAxis === 'y') wheel.rotation.y += rightSpeed * 0.2;
      else wheel.rotation.z += rightSpeed * 0.2;
    }
  });
  
  // Apply rotation and movement
  if (Math.abs(turnSpeed) > 0.0001) {
    car.rotation.y -= turnSpeed;
  }
  
  if (Math.abs(moveSpeed) > 0.0001) {
    car.position.x -= moveSpeed * Math.sin(car.rotation.y);
    car.position.z -= moveSpeed * Math.cos(car.rotation.y);
  }
  
  // Front wheel steering
  if (frontWheel) {
    if (Math.abs(turnRate) > 0.01) {
      frontWheel.rotation.y = turnRate * 0.5;
    } else {
      frontWheel.rotation.y *= 0.9;
    }
  }
}

export function createRenderLoop(
  scene: Scene,
  getParams: () => RenderLoopParams | null
): () => void {
  return () => {
    const params = getParams();
    
    if (params) {
      if (params.physicsManager) {
        updateCarWithPhysics(params);
      } else {
        updateCarKinematic(params);
      }
    }
    
    scene.render();
  };
}
