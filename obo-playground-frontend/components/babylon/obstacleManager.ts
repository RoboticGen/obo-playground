import * as BABYLON from '@babylonjs/core';
import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  DirectionalLight,
  ShadowGenerator,
} from '@babylonjs/core';

export interface Obstacle {
  type: 'box' | 'wall' | 'sphere' | 'cylinder';
  size: number[];
  position: number[];
  rotation?: number[];
  color?: string;
}

export function createObstacles(scene: Scene, obstacles: Obstacle[], shadowGenerator: ShadowGenerator): Mesh[] {
  const meshes: Mesh[] = [];
  
  obstacles.forEach((obstacle, index) => {
    let mesh: Mesh | null = null;
    
    switch (obstacle.type) {
      case 'box':
      case 'wall':
        mesh = MeshBuilder.CreateBox(`obstacle_${index}`, {
          width: obstacle.size[0],
          height: obstacle.size[1],
          depth: obstacle.size[2],
        }, scene);
        break;
        
      case 'sphere':
        mesh = MeshBuilder.CreateSphere(`obstacle_${index}`, {
          diameter: obstacle.size[0],
        }, scene);
        break;
        
      case 'cylinder':
        mesh = MeshBuilder.CreateCylinder(`obstacle_${index}`, {
          diameter: obstacle.size[0],
          height: obstacle.size[1],
        }, scene);
        break;
    }
    
    if (mesh) {
      mesh.position = new Vector3(obstacle.position[0], obstacle.position[1], obstacle.position[2]);
      
      if (obstacle.rotation) {
        mesh.rotation = new Vector3(obstacle.rotation[0], obstacle.rotation[1], obstacle.rotation[2]);
      }
      
      const material = new StandardMaterial(`obstacleMat_${index}`, scene);
      material.diffuseColor = Color3.FromHexString(obstacle.color || '#888888');
      mesh.material = material;
      
      shadowGenerator.addShadowCaster(mesh);
      meshes.push(mesh);
    }
  });
  
  return meshes;
}

export function updateObstacles(scene: Scene, obstacles: Obstacle[]): void {
  // Remove old obstacles
  const oldObstacles = scene.meshes.filter(mesh => mesh.name.startsWith('obstacle_'));
  oldObstacles.forEach(mesh => mesh.dispose());
  
  // Find shadow generator
  const directionalLight = scene.lights.find(l => l instanceof DirectionalLight) as DirectionalLight | undefined;
  const shadowGenerator = directionalLight?.getShadowGenerator() as ShadowGenerator | undefined;
  
  if (!shadowGenerator) return;
  
  // Create new obstacles
  createObstacles(scene, obstacles, shadowGenerator);
}

export function updateGroundColor(scene: Scene, color: string): void {
  const ground = scene.getMeshByName('ground');
  if (ground) {
    const groundMaterial = ground.material as StandardMaterial;
    if (groundMaterial) {
      groundMaterial.diffuseColor = Color3.FromHexString(color);
    }
  }
}
