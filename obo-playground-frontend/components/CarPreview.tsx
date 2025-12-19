'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export default function CarPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const isCleanedUpRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    isCleanedUpRef.current = false;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    
    sceneRef.current = scene;
    engineRef.current = engine;
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 3,
      Math.PI / 2.5,
      12,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 20;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.95;

    // Lighting
    const hemisphericLight = new BABYLON.HemisphericLight(
      'hemisphericLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemisphericLight.intensity = 1.0;

    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -2, -1),
      scene
    );
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.8;

    const keyLight = new BABYLON.PointLight(
      'keyLight',
      new BABYLON.Vector3(5, 5, -5),
      scene
    );
    keyLight.intensity = 0.6;
    keyLight.diffuse = new BABYLON.Color3(0.2, 0.5, 1.0);

    const fillLight = new BABYLON.PointLight(
      'fillLight',
      new BABYLON.Vector3(-5, 3, 5),
      scene
    );
    fillLight.intensity = 0.4;

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 30, height: 30 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    groundMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    groundMaterial.specularPower = 64;
    ground.material = groundMaterial;

    // Load car model
    BABYLON.SceneLoader.ImportMesh(
      '',
      '/model/',
      'obocar.glb',
      scene,
      (meshes) => {
        if (isCleanedUpRef.current || scene.isDisposed) return;

        const car = meshes[0];
        car.position = new BABYLON.Vector3(0, 1, 0);
        car.scaling = new BABYLON.Vector3(0.02, 0.02, 0.02);

        // Slow rotation
        scene.registerBeforeRender(() => {
          car.rotation.y += 0.003;
        });

        // Add shadows
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        meshes.forEach((mesh) => {
          if (mesh !== car) {
            shadowGenerator.addShadowCaster(mesh);
          }
        });
        ground.receiveShadows = true;
      },
      undefined,
      (_, message) => {
        if (!isCleanedUpRef.current) {
          console.error('Error loading car model:', message);
        }
      }
    );

    // Render loop
    engine.runRenderLoop(() => {
      if (!sceneRef.current?.isDisposed) {
        scene.render();
      }
    });

    // Handle resize
    const handleResize = () => {
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isCleanedUpRef.current = true;
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current && !sceneRef.current.isDisposed) {
        sceneRef.current.dispose();
      }
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
