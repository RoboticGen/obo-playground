'use client';

import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

// Dynamic import for anime.js to avoid SSR issues
let anime: any = null;

export default function CarPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExploded, setIsExploded] = useState(false);
  const meshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const originalPositionsRef = useRef<Map<string, BABYLON.Vector3>>(new Map());
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const isCleanedUpRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Reset cleanup flag
    isCleanedUpRef.current = false;
    timeoutsRef.current = [];

    // Dynamically import anime.js
    const loadAnime = async () => {
      if (!anime) {
        const animeModule = await import('animejs');
        anime = animeModule.default || animeModule;
      }
      return anime;
    };

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    
    // Store references
    sceneRef.current = scene;
    engineRef.current = engine;
    // Transparent background for better separation from page
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Camera - better angle for exploded view
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

    // Enhanced Lighting for better visibility
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

    // Key light from front
    const keyLight = new BABYLON.PointLight(
      'keyLight',
      new BABYLON.Vector3(5, 5, -5),
      scene
    );
    keyLight.intensity = 0.6;
    keyLight.diffuse = new BABYLON.Color3(0.2, 0.5, 1.0); // Blue tint

    // Fill light
    const fillLight = new BABYLON.PointLight(
      'fillLight',
      new BABYLON.Vector3(-5, 3, 5),
      scene
    );
    fillLight.intensity = 0.4;

    // Ground with reflection
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

    // Load car model - ensure anime is loaded first
    loadAnime().then(() => {
      // Check if component was unmounted before model loading started
      if (isCleanedUpRef.current || !sceneRef.current) {
        return;
      }

      BABYLON.SceneLoader.ImportMesh(
        '',
        '/model/',
        'obocar.glb',
        scene,
        (meshes) => {
          // Check if scene was disposed during loading
          if (isCleanedUpRef.current || scene.isDisposed) {
            return;
          }

          const car = meshes[0];
          car.position = new BABYLON.Vector3(0, 1, 0);
          car.scaling = new BABYLON.Vector3(0.02, 0.02, 0.02);
          
          // Store all meshes for animation
          meshesRef.current = meshes.filter(mesh => mesh !== car && mesh.name !== '__root__');
          
          // Store original positions
          meshesRef.current.forEach((mesh) => {
            if (mesh.position) {
              originalPositionsRef.current.set(
                mesh.name,
                mesh.position.clone()
              );
            }
          });

          // Slow rotation
          let rotationSpeed = 0.003;
          scene.registerBeforeRender(() => {
            car.rotation.y += rotationSpeed;
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

          // Auto-trigger explode animation after 2 seconds
          const explodeTimeout = setTimeout(() => {
            if (!isCleanedUpRef.current) {
              triggerExplodeAnimation();
            }
          }, 2000);

          timeoutsRef.current.push(explodeTimeout);
        },
        undefined,
        (scene, message) => {
          // Only log error if component is still mounted
          if (!isCleanedUpRef.current) {
            console.error('Error loading car model:', message);
          }
        }
      );
    }).catch((error) => {
      if (!isCleanedUpRef.current) {
        console.error('Failed to load anime.js:', error);
      }
    });

    // Explode animation function
    const triggerExplodeAnimation = () => {
      if (isCleanedUpRef.current || !sceneRef.current || sceneRef.current.isDisposed) {
        return;
      }

      setIsExploded(true);
      
      const meshes = meshesRef.current;
      const carCenter = new BABYLON.Vector3(0, 1, 0);
      
      // Group meshes by type for coordinated animation
      const wheels: BABYLON.AbstractMesh[] = [];
      const bodyParts: BABYLON.AbstractMesh[] = [];
      const smallParts: BABYLON.AbstractMesh[] = [];
      
      meshes.forEach((mesh) => {
        const name = mesh.name.toLowerCase();
        if (name.includes('roda') || name.includes('wheel')) {
          wheels.push(mesh);
        } else if (name.includes('body') || name.includes('chassi')) {
          bodyParts.push(mesh);
        } else {
          smallParts.push(mesh);
        }
      });

      // Animate each mesh group
      [...wheels, ...bodyParts, ...smallParts].forEach((mesh, index) => {
        const originalPos = originalPositionsRef.current.get(mesh.name);
        if (!originalPos) return;

        // Calculate explosion direction (away from center)
        const direction = mesh.getAbsolutePosition().subtract(carCenter).normalize();
        
        // Explosion distance based on mesh type
        let explosionDistance = 3;
        if (wheels.includes(mesh)) {
          explosionDistance = 4; // Wheels go further
        } else if (bodyParts.includes(mesh)) {
          explosionDistance = 2.5;
        } else {
          explosionDistance = 3.5; // Small parts spread out
        }

        const targetPos = {
          x: originalPos.x + direction.x * explosionDistance,
          y: originalPos.y + direction.y * explosionDistance + Math.random() * 1,
          z: originalPos.z + direction.z * explosionDistance,
        };

        // Stagger animation
        if (anime) {
          anime({
            targets: mesh.position,
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2000,
            delay: index * 30, // Stagger each part
            easing: 'easeOutElastic(1, .6)',
          });

          // Rotate parts during explosion
          if (mesh.rotation) {
            anime({
              targets: mesh.rotation,
              x: mesh.rotation.x + (Math.random() - 0.5) * Math.PI * 2,
              y: mesh.rotation.y + (Math.random() - 0.5) * Math.PI * 2,
              z: mesh.rotation.z + (Math.random() - 0.5) * Math.PI * 2,
              duration: 2000,
              delay: index * 30,
              easing: 'easeOutCubic',
            });
          }
        }
      });

      // Implode after 3 seconds
      const implodeTimeout = setTimeout(() => {
        if (!isCleanedUpRef.current) {
          triggerImplodeAnimation();
        }
      }, 3000);

      timeoutsRef.current.push(implodeTimeout);
    };

    // Implode animation function
    const triggerImplodeAnimation = () => {
      if (isCleanedUpRef.current || !sceneRef.current || sceneRef.current.isDisposed) {
        return;
      }

      setIsExploded(false);
      
      meshesRef.current.forEach((mesh, index) => {
        const originalPos = originalPositionsRef.current.get(mesh.name);
        if (!originalPos) return;

        if (anime) {
          anime({
            targets: mesh.position,
            x: originalPos.x,
            y: originalPos.y,
            z: originalPos.z,
            duration: 1500,
            delay: index * 20,
            easing: 'easeInOutQuad',
          });

          // Reset rotation
          if (mesh.rotation && mesh.rotation.x !== 0) {
            const currentRotation = {
              x: mesh.rotation.x,
              y: mesh.rotation.y,
              z: mesh.rotation.z,
            };
            
            anime({
              targets: currentRotation,
              x: 0,
              y: 0,
              z: 0,
              duration: 1500,
              delay: index * 20,
              easing: 'easeInOutQuad',
              update: () => {
                if (mesh.rotation) {
                  mesh.rotation.x = currentRotation.x;
                  mesh.rotation.y = currentRotation.y;
                  mesh.rotation.z = currentRotation.z;
                }
              },
            });
          }
        }
      });

      // Trigger explode again after reassembly
      const explodeTimeout = setTimeout(() => {
        if (!isCleanedUpRef.current) {
          triggerExplodeAnimation();
        }
      }, 2500);

      timeoutsRef.current.push(explodeTimeout);
    };

    // Render loop
    engine.runRenderLoop(() => {
      if (!sceneRef.current?.isDisposed) {
        scene.render();
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      isCleanedUpRef.current = true;
      
      // Clear all stored timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      
      // Remove all anime animations
      if (anime && typeof anime.remove === 'function') {
        anime.remove(meshesRef.current);
      }
      
      // Remove event listener
      window.removeEventListener('resize', handleResize);
      
      // Dispose scene and engine
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
      
      {/* Animation status indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-sm border border-neutral-800 bg-black/80 px-4 py-2 backdrop-blur-sm">
          <div className={`h-2 w-2 rounded-full ${isExploded ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></div>
          <span className="text-xs font-medium text-neutral-400">
            {isExploded ? 'Exploded View' : 'Assembly View'}
          </span>
        </div>
      </div>
    </div>
  );
}
