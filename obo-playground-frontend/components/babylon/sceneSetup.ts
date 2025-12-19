import {
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  DirectionalLight,
  ShadowGenerator,
  Engine,
  WebGPUEngine,
} from '@babylonjs/core';

export interface SceneSetupResult {
  scene: Scene;
  camera: ArcRotateCamera;
  shadowGenerator: ShadowGenerator;
  gridLines: Mesh[];
}

export async function createEngine(canvas: HTMLCanvasElement): Promise<{ engine: Engine | WebGPUEngine; isWebGPU: boolean }> {
  try {
    if (await WebGPUEngine.IsSupportedAsync) {
      const webGPUEngine = new WebGPUEngine(canvas);
      await webGPUEngine.initAsync();
      return { engine: webGPUEngine, isWebGPU: true };
    }
    throw new Error('WebGPU not supported');
  } catch {
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    return { engine, isWebGPU: false };
  }
}

export function setupScene(engine: Engine | WebGPUEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0.85, 0.9, 1).toColor4();
  return scene;
}

export function setupCamera(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 3,
    80,
    Vector3.Zero(),
    scene
  );
  
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 300;
  camera.wheelPrecision = 5;
  camera.panningSensibility = 50;
  camera.angularSensibilityX = 500;
  camera.angularSensibilityY = 500;
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2;
  
  return camera;
}

export function setupLights(scene: Scene): ShadowGenerator {
  const hemisphericLight = new HemisphericLight('hemisphericLight', new Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 0.7;

  const directionalLight = new DirectionalLight('directionalLight', new Vector3(-1, -2, -1), scene);
  directionalLight.position = new Vector3(20, 40, 20);
  directionalLight.intensity = 0.5;

  const shadowGenerator = new ShadowGenerator(1024, directionalLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  
  return shadowGenerator;
}

export function setupGround(scene: Scene, groundColor: string = '#4caf50'): Mesh {
  const ground = MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, scene);
  const groundMaterial = new StandardMaterial('groundMaterial', scene);
  
  groundMaterial.diffuseColor = Color3.FromHexString(groundColor);
  groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMaterial;
  ground.receiveShadows = true;
  
  return ground;
}

export function setupGrid(scene: Scene): Mesh[] {
  const gridLines: Mesh[] = [];
  
  for (let i = -10; i <= 10; i++) {
    if (i !== 0) {
      const lineX = MeshBuilder.CreateBox(`lineX${i}`, { width: 200, height: 0.1, depth: 0.2 }, scene);
      lineX.position = new Vector3(0, 0.05, i * 10);
      
      const lineZ = MeshBuilder.CreateBox(`lineZ${i}`, { width: 0.2, height: 0.1, depth: 200 }, scene);
      lineZ.position = new Vector3(i * 10, 0.05, 0);
      
      const lineMaterial = new StandardMaterial(`lineMat${i}`, scene);
      lineMaterial.diffuseColor = new Color3(0.3, 0.6, 0.3);
      lineX.material = lineMaterial;
      lineZ.material = lineMaterial;
      
      gridLines.push(lineX, lineZ);
    }
  }
  
  return gridLines;
}
