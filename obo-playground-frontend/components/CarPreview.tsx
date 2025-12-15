'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export default function CarPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2.5,
      8,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 15;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.9;

    // Lighting
    const hemisphericLight = new BABYLON.HemisphericLight(
      'hemisphericLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemisphericLight.intensity = 0.8;

    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -2, -1),
      scene
    );
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.6;

    // Spotlight for dramatic effect
    const spotLight = new BABYLON.SpotLight(
      'spotLight',
      new BABYLON.Vector3(5, 10, 5),
      new BABYLON.Vector3(-1, -2, -1),
      Math.PI / 3,
      2,
      scene
    );
    spotLight.intensity = 0.8;
    spotLight.diffuse = new BABYLON.Color3(0.11, 0.31, 0.85); // blue-700 navy color

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 20, height: 20 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    // Load car model
    BABYLON.SceneLoader.ImportMesh(
      '',
      '/model/',
      'obocar.glb',
      scene,
      (meshes) => {
        const car = meshes[0];
        car.position = new BABYLON.Vector3(0, 0.5, 0);
        car.scaling = new BABYLON.Vector3(0.02, 0.02, 0.02);
        
        // Rotate the car slowly for preview
        scene.registerBeforeRender(() => {
          car.rotation.y += 0.005;
        });

        // Add shadow
        const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
        meshes.forEach((mesh) => {
          if (mesh !== car) {
            shadowGenerator.addShadowCaster(mesh);
          }
        });
        ground.receiveShadows = true;
      },
      undefined,
      (scene, message) => {
        console.error('Error loading car model:', message);
      }
    );

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ outline: 'none' }}
    />
  );
}
