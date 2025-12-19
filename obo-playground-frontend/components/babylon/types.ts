import { Scene, AbstractMesh, Engine, ArcRotateCamera, Mesh } from '@babylonjs/core';
import { WebGPUEngine } from '@babylonjs/core';

export interface CarState {
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  leftMotorDirection: number;
  rightMotorDirection: number;
  frontDistance: number;
  leftDistance: number;
  rightDistance: number;
}

export interface BabylonSceneProps {
  onSceneReady?: (scene: Scene, car: AbstractMesh | null) => void;
  carState?: CarState;
  environment?: any;
}

export interface SceneRefs {
  canvas: HTMLCanvasElement;
  scene: Scene | null;
  engine: Engine | WebGPUEngine | null;
  camera: ArcRotateCamera | null;
  car: AbstractMesh | null;
  leftWheels: AbstractMesh[];
  rightWheels: AbstractMesh[];
  frontWheel: AbstractMesh | null;
  physicsManager: any;
  gridLines: Mesh[];
  carState: CarState;
  initialPosition: { x: number; y: number; z: number };
  initialRotation: number;
}

export const DEFAULT_CAR_STATE: CarState = {
  leftMotorSpeed: 0,
  rightMotorSpeed: 0,
  leftMotorDirection: 0,
  rightMotorDirection: 0,
  frontDistance: 100,
  leftDistance: 100,
  rightDistance: 100,
};
