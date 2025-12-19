import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SceneLoader,
  AbstractMesh,
  ShadowGenerator,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export interface CarLoadResult {
  car: AbstractMesh;
  leftWheels: AbstractMesh[];
  rightWheels: AbstractMesh[];
  frontWheel: AbstractMesh | null;
}

function findMeshDescendants(node: any): AbstractMesh[] {
  const meshes: AbstractMesh[] = [];
  
  if (node instanceof AbstractMesh && (node as any).geometry) {
    meshes.push(node);
  }
  
  const children = node.getChildren ? node.getChildren() : [];
  children.forEach((child: any) => {
    meshes.push(...findMeshDescendants(child));
  });
  
  return meshes;
}

function determineWheelRotationAxis(transformNodes: any[]): 'x' | 'y' | 'z' {
  let wheelRotationAxis: 'x' | 'y' | 'z' = 'x';
  
  transformNodes?.forEach((node) => {
    if (node.name.includes('Eixo - Encaixe D')) {
      const descendants = findMeshDescendants(node);
      if (descendants.length > 0) {
        const rodMesh = descendants[0];
        const boundingInfo = rodMesh.getBoundingInfo();
        const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);
        
        if (size.z > size.x && size.z > size.y) {
          wheelRotationAxis = 'z';
        }
      }
    }
  });
  
  return wheelRotationAxis;
}

function findWheels(result: any): { leftWheels: AbstractMesh[]; rightWheels: AbstractMesh[]; frontWheel: AbstractMesh | null } {
  const leftWheels: AbstractMesh[] = [];
  const rightWheels: AbstractMesh[] = [];
  let frontWheel: AbstractMesh | null = null;
  
  // Find front steering wheel
  result.transformNodes?.forEach((node: any) => {
    if (node.name === '12mmball:1' || node.name.includes('12mmball')) {
      const wheelMeshes = findMeshDescendants(node);
      if (wheelMeshes.length > 0) {
        frontWheel = wheelMeshes[0];
      }
    }
  });
  
  // Find left and right wheels
  if (result.transformNodes && result.transformNodes.length > 0) {
    result.transformNodes.forEach((node: any) => {
      if (node.name === 'Roda 34 mm v2:3') {
        leftWheels.push(...findMeshDescendants(node));
      } else if (node.name === 'Roda 34 mm v2:4') {
        rightWheels.push(...findMeshDescendants(node));
      }
    });
  }
  
  // Fallback: check meshes directly
  if (leftWheels.length === 0 || rightWheels.length === 0) {
    result.meshes.forEach((mesh: AbstractMesh) => {
      const meshName = mesh.name;
      if ((meshName.includes('Body1_node_101') || meshName === 'Roda 34 mm v2:3') && leftWheels.length === 0) {
        leftWheels.push(mesh);
      } else if ((meshName.includes('Body1_node_102') || meshName === 'Roda 34 mm v2:4') && rightWheels.length === 0) {
        rightWheels.push(mesh);
      }
    });
  }
  
  return { leftWheels, rightWheels, frontWheel };
}

async function loadGLBModel(scene: Scene, shadowGenerator: ShadowGenerator): Promise<CarLoadResult | null> {
  try {
    const result = await SceneLoader.ImportMeshAsync('', '/model/', 'obocar.glb', scene);
    
    if (result.meshes.length === 0) return null;
    
    const car = result.meshes[0];
    car.position = new Vector3(0, 2, 0);
    car.scaling = new Vector3(0.1, 0.1, 0.1);
    car.rotationQuaternion = null;
    car.rotation.y = Math.PI;
    
    // Add direction arrow
    const arrow = MeshBuilder.CreateCylinder('directionArrow', { height: 5, diameter: 0.5 }, scene);
    arrow.position = new Vector3(-3, 2, 0);
    arrow.rotation.z = Math.PI / 2;
    const arrowMat = new StandardMaterial('arrowMat', scene);
    arrowMat.diffuseColor = new Color3(1, 0, 0);
    arrowMat.emissiveColor = new Color3(0.5, 0, 0);
    arrow.material = arrowMat;
    arrow.parent = car;
    
    // Add shadows
    result.meshes.forEach((mesh) => shadowGenerator.addShadowCaster(mesh));
    
    // Store rotation axis
    (car as any).wheelRotationAxis = determineWheelRotationAxis(result.transformNodes || []);
    
    const wheels = findWheels(result);
    
    return { car, ...wheels };
  } catch {
    return null;
  }
}

async function loadGLTFModel(scene: Scene, shadowGenerator: ShadowGenerator): Promise<CarLoadResult | null> {
  try {
    const result = await SceneLoader.ImportMeshAsync('', '/model/', 'obocar.gltf', scene);
    
    if (result.meshes.length === 0) return null;
    
    const car = result.meshes[0];
    car.position = new Vector3(0, 4, 0);
    car.scaling = new Vector3(0.5, 0.5, 0.5);
    
    result.meshes.forEach((mesh) => shadowGenerator.addShadowCaster(mesh));
    
    const wheels = findWheels(result);
    
    return { car, ...wheels };
  } catch {
    return null;
  }
}

function createPlaceholderCar(scene: Scene, shadowGenerator: ShadowGenerator): CarLoadResult {
  const carBody = MeshBuilder.CreateBox('carBody', { width: 3, height: 1, depth: 4.5 }, scene);
  carBody.position = new Vector3(0, 1.5, 0);
  
  const carMaterial = new StandardMaterial('carMaterial', scene);
  carMaterial.diffuseColor = new Color3(0.2, 0.6, 0.9);
  carBody.material = carMaterial;
  
  const wheelPositions = [
    new Vector3(-1.5, 0.3, 2),
    new Vector3(1.5, 0.3, 2),
    new Vector3(-1.5, 0.3, -2),
    new Vector3(1.5, 0.3, -2),
  ];
  
  const leftWheels: AbstractMesh[] = [];
  const rightWheels: AbstractMesh[] = [];
  
  wheelPositions.forEach((pos, index) => {
    const wheel = MeshBuilder.CreateCylinder(`wheel${index}`, { height: 0.5, diameter: 1 }, scene);
    wheel.rotation.z = Math.PI / 2;
    wheel.position = pos;
    wheel.parent = carBody;
    
    const wheelMaterial = new StandardMaterial(`wheelMaterial${index}`, scene);
    wheelMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
    wheel.material = wheelMaterial;
    
    if (index % 2 === 0) {
      leftWheels.push(wheel);
    } else {
      rightWheels.push(wheel);
    }
  });
  
  shadowGenerator.addShadowCaster(carBody);
  
  return { car: carBody, leftWheels, rightWheels, frontWheel: null };
}

export async function loadCar(scene: Scene, shadowGenerator: ShadowGenerator): Promise<CarLoadResult> {
  // Try GLB first
  let result = await loadGLBModel(scene, shadowGenerator);
  if (result) return result;
  
  // Try GLTF
  result = await loadGLTFModel(scene, shadowGenerator);
  if (result) return result;
  
  // Fallback to placeholder
  return createPlaceholderCar(scene, shadowGenerator);
}
