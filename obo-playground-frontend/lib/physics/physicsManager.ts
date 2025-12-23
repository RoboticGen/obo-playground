/**
 * Havok Physics Manager for Obo-Playground
 */

import * as BABYLON from '@babylonjs/core';
import { PHYSICS_CONFIG } from './physicsConfig';

export class PhysicsManager {
  private scene: BABYLON.Scene;
  private havokPlugin: BABYLON.HavokPlugin | null = null;
  private havokInstance: any;
  private carBody: BABYLON.PhysicsAggregate | null = null;
  private wheelMeshes: BABYLON.AbstractMesh[] = [];
  private carMesh: BABYLON.AbstractMesh | null = null;
  private initialized = false;
  private lastLeftMotorSpeed = 0;
  private lastRightMotorSpeed = 0;

  constructor(scene: BABYLON.Scene, havokInstance: any) {
    this.scene = scene;
    this.havokInstance = havokInstance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('PhysicsManager already initialized');
      return;
    }

    try {
      this.havokPlugin = new BABYLON.HavokPlugin(true, this.havokInstance);
      this.scene.enablePhysics(
        new BABYLON.Vector3(
          PHYSICS_CONFIG.gravity.x,
          PHYSICS_CONFIG.gravity.y,
          PHYSICS_CONFIG.gravity.z
        ),
        this.havokPlugin
      );
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Havok physics:', error);
      throw error;
    }
  }

  setupCarPhysics(
    carMesh: BABYLON.AbstractMesh,
    leftWheels: BABYLON.AbstractMesh[],
    rightWheels: BABYLON.AbstractMesh[]
  ): void {
    if (!this.initialized) {
      console.error('Physics not initialized. Call initialize() first.');
      return;
    }

    this.carMesh = carMesh;

    try {
      // Use BOX collider - must match car mesh bounds
      const carAggregate = new BABYLON.PhysicsAggregate(
        carMesh,
        BABYLON.PhysicsShapeType.BOX,
        {
          mass: PHYSICS_CONFIG.car.mass,
          friction: 1.0,
          restitution: 0.1,
        },
        this.scene
      );

      this.carBody = carAggregate;
      
      if (this.carBody.body) {
        this.carBody.body.setLinearDamping(0.5);
        this.carBody.body.setAngularDamping(0.99);
        this.carBody.body.setMassProperties({
          inertia: new BABYLON.Vector3(0, 1, 0),
        });
        // Enable gravity
        this.carBody.body.setGravityFactor(1);
        // Disable sleeping to keep physics active
        this.carBody.body.disablePreStep = false;
      }

      this.wheelMeshes = [...leftWheels, ...rightWheels];
    } catch (error) {
      console.error('Error setting up car physics:', error);
      throw error;
    }
  }

  applyMotorTorque(leftMotorSpeed: number, rightMotorSpeed: number): void {
    this.lastLeftMotorSpeed = leftMotorSpeed;
    this.lastRightMotorSpeed = rightMotorSpeed;

    if (!this.initialized || !this.carBody?.body || !this.carMesh) {
      return;
    }

    if (leftMotorSpeed === 0 && rightMotorSpeed === 0) {
      this.carBody.body.setAngularVelocity(BABYLON.Vector3.Zero());
      this.carBody.body.setLinearVelocity(BABYLON.Vector3.Zero());
      return;
    }

    const maxSpeed = 5.0;
    const leftSpeed = (Math.abs(leftMotorSpeed) / 512) * maxSpeed;
    const rightSpeed = (Math.abs(rightMotorSpeed) / 512) * maxSpeed;
    const leftDir = leftMotorSpeed >= 0 ? 1 : -1;
    const rightDir = rightMotorSpeed >= 0 ? 1 : -1;
    
    const forwardSpeed = ((leftSpeed * leftDir) + (rightSpeed * rightDir)) / 2;
    const turnSpeed = ((leftSpeed * leftDir) - (rightSpeed * rightDir)) * 1.0;
    
    const carRotation = this.carMesh.rotationQuaternion || BABYLON.Quaternion.Identity();
    const forwardDirection = new BABYLON.Vector3(1, 0, 0);
    const worldForward = forwardDirection.applyRotationQuaternion(carRotation);
    
    const velocity = worldForward.scale(forwardSpeed);
    velocity.y = this.carBody.body.getLinearVelocity().y;
    
    this.carBody.body.setLinearVelocity(velocity);
    this.carBody.body.setAngularVelocity(new BABYLON.Vector3(0, turnSpeed, 0));
  }

  getCarPosition(): BABYLON.Vector3 {
    if (!this.carBody || !this.carMesh) {
      return BABYLON.Vector3.Zero();
    }
    return this.carMesh.position.clone();
  }

  getCarRotation(): BABYLON.Quaternion {
    if (!this.carBody || !this.carMesh) {
      return BABYLON.Quaternion.Identity();
    }
    return this.carMesh.rotationQuaternion?.clone() || BABYLON.Quaternion.Identity();
  }

  getCarVelocity(): BABYLON.Vector3 {
    if (!this.carBody?.body) {
      return BABYLON.Vector3.Zero();
    }
    return this.carBody.body.getLinearVelocity().clone();
  }

  getCarAngularVelocity(): BABYLON.Vector3 {
    if (!this.carBody?.body) {
      return BABYLON.Vector3.Zero();
    }
    return this.carBody.body.getAngularVelocity().clone();
  }

  updateWheelRotation(): void {
    if (!this.wheelMeshes.length) return;

    // Wheels should rotate based on their motor speeds, not just forward velocity
    // Left wheels rotate based on left motor speed
    if (this.wheelMeshes.length >= 2) {
      const leftSpeed = (Math.abs(this.lastLeftMotorSpeed) / 512) * 0.2;
      const leftDir = this.lastLeftMotorSpeed >= 0 ? 1 : -1;  // Flip direction
      
      // Assuming first 2 wheels are left
      for (let i = 0; i < Math.min(2, this.wheelMeshes.length); i++) {
        const wheel = this.wheelMeshes[i];
        if (wheel) {
          wheel.rotation.x += leftDir * leftSpeed;
        }
      }
      
      // Right wheels rotate based on right motor speed
      const rightSpeed = (Math.abs(this.lastRightMotorSpeed) / 512) * 0.2;
      const rightDir = this.lastRightMotorSpeed >= 0 ? 1 : -1;  // Flip direction
      
      // Remaining wheels are right (assuming 2 left + 2 right = 4 total)
      for (let i = 2; i < this.wheelMeshes.length; i++) {
        const wheel = this.wheelMeshes[i];
        if (wheel) {
          // Negate right wheels to compensate for mirrored geometry
          wheel.rotation.x -= rightDir * rightSpeed;
        }
      }
    }
  }

  constrainCarHeight(): void {
    if (!this.carBody?.body || !this.carMesh) return;

    const minHeight = 2;
    if (this.carMesh.position.y < minHeight) {
      this.carMesh.position.y = minHeight;
      const vel = this.carBody.body.getLinearVelocity();
      if (vel.y < 0) {
        this.carBody.body.setLinearVelocity(new BABYLON.Vector3(vel.x, 0, vel.z));
      }
    }
  }

  raycast(from: BABYLON.Vector3, to: BABYLON.Vector3): { hasHit: boolean; distance: number } {
    if (!this.havokPlugin) {
      return { hasHit: false, distance: Infinity };
    }
    return { hasHit: false, distance: BABYLON.Vector3.Distance(from, to) };
  }

  resetCar(position: BABYLON.Vector3, rotation: BABYLON.Quaternion): void {
    if (!this.carBody || !this.carMesh) return;

    this.carMesh.position = position.clone();
    this.carMesh.rotationQuaternion = rotation.clone();

    if (this.carBody.body) {
      this.carBody.body.setLinearVelocity(BABYLON.Vector3.Zero());
      this.carBody.body.setAngularVelocity(BABYLON.Vector3.Zero());
    }
  }

  dispose(): void {
    if (this.carBody) {
      this.carBody.dispose();
    }

    this.carBody = null;
    this.wheelMeshes = [];
    this.carMesh = null;
    this.havokPlugin = null;
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

let physicsManagerInstance: PhysicsManager | null = null;

export function createPhysicsManager(scene: BABYLON.Scene, havokInstance: any): PhysicsManager {
  if (physicsManagerInstance) {
    physicsManagerInstance.dispose();
  }
  physicsManagerInstance = new PhysicsManager(scene, havokInstance);
  return physicsManagerInstance;
}

export function getPhysicsManager(): PhysicsManager | null {
  return physicsManagerInstance;
}

export function disposePhysicsManager(): void {
  if (physicsManagerInstance) {
    physicsManagerInstance.dispose();
    physicsManagerInstance = null;
  }
}
