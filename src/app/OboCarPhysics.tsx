// OboCarPhysics.tsx
// 3D OboCar with cannon-es physics, movement, rotation, and sensor API

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as CANNON from "cannon-es";

// --- Sensor & API Types ---
export type OboCarSensorData = {
  velocity: number;
  position: [number, number, number];
  rotation: [number, number, number];
  distanceToGround: number;
};

export type OboCarAPI = {
  move: (speed: number) => void;
  rotate: (angleDeg: number) => void;
  getSensors: () => OboCarSensorData;
  reset: () => void;
  forward: (speed: number, duration: number) => void;
  rotateBy: (angleDeg: number, duration: number) => void;
};

// --- Hook Implementation ---
export function useOboCarPhysics(ref: React.RefObject<THREE.Mesh>): OboCarAPI {
  const world = useRef<CANNON.World | null>(null);
  const carBody = useRef<CANNON.Body | null>(null);

  const sensors = useRef<OboCarSensorData>({
    velocity: 0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    distanceToGround: 0,
  });

  // Physics init
  useEffect(() => {
    const w = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    w.broadphase = new CANNON.SAPBroadphase(w);
    w.solver.iterations = 10;
    w.solver.tolerance = 0.001;

    // Car body
    const shape = new CANNON.Box(new CANNON.Vec3(0.2, 0.1, 0.35));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(0, 0.2, 0);
    body.angularDamping = 0.3;
    body.linearDamping = 0.1;
    body.angularFactor.set(0, 1, 0); // allow only yaw
    w.addBody(body);

    // Ground
    const groundShape = new CANNON.Box(new CANNON.Vec3(5, 0.05, 5));
    const ground = new CANNON.Body({ mass: 0 });
    ground.addShape(groundShape);
    ground.position.set(0, 0, 0);
    w.addBody(ground);

    world.current = w;
    carBody.current = body;

    return () => {
      if (world.current && carBody.current) {
        world.current.removeBody(carBody.current);
      }
      world.current = null;
      carBody.current = null;
    };
  }, []);

  // --- Physics stepping ---
  const FIXED_STEP = 1 / 60;
  const accumulator = useRef(0);
  const maxSubSteps = 3;

  // --- Command & targets ---
  const commandQueue = useRef<Array<() => void>>([]);
  const busy = useRef(false);

  const targetLinear = useRef<{ speed: number; endTime: number } | null>(null);
  const targetAngular = useRef<{
    speed: number; // rad/s
    targetYaw: number; // radians
    timeoutAt: number;
  } | null>(null);

  // --- Temp objects for reuse ---
  const tmpForward = useRef(new CANNON.Vec3());
  const tmpQuat = useRef(new THREE.Quaternion());
  const tmpEuler = useRef(new THREE.Euler());
  const rayFrom = useRef(new CANNON.Vec3());
  const rayTo = useRef(new CANNON.Vec3());
  const rayResult = useRef(new CANNON.RaycastResult());

  // --- Main physics loop ---
  useFrame((_, delta) => {
    if (!world.current || !carBody.current) return;
    const body = carBody.current;

    // Fixed-step accumulator
    accumulator.current += delta;
    let steps = 0;
    while (accumulator.current >= FIXED_STEP && steps < maxSubSteps) {
      world.current.step(FIXED_STEP);
      accumulator.current -= FIXED_STEP;
      steps++;
    }

    const now = performance.now() / 1000;

    // Handle forward motion
    if (targetLinear.current) {
      if (now < targetLinear.current.endTime) {
        tmpForward.current.set(0, 0, 1);
        body.quaternion.vmult(tmpForward.current, tmpForward.current);
        body.velocity.x = tmpForward.current.x * targetLinear.current.speed;
        body.velocity.y = 0;
        body.velocity.z = tmpForward.current.z * targetLinear.current.speed;
      } else {
        body.velocity.set(0, 0, 0);
        targetLinear.current = null;
        busy.current = false;
      }
    }

    // Handle rotation
    if (targetAngular.current) {
      tmpQuat.current.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      tmpEuler.current.setFromQuaternion(tmpQuat.current, "XYZ");
      const currentYaw = tmpEuler.current.y;

      // shortest signed diff
      let diff = targetAngular.current.targetYaw - currentYaw;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      const eps = 0.01; // tolerance ~0.6°
      if (Math.abs(diff) <= eps || now > targetAngular.current.timeoutAt) {
        // snap
        tmpEuler.current.y = targetAngular.current.targetYaw;
        const snapped = new THREE.Quaternion().setFromEuler(tmpEuler.current);
        body.quaternion.set(snapped.x, snapped.y, snapped.z, snapped.w);
        body.angularVelocity.set(0, 0, 0);
        targetAngular.current = null;
        busy.current = false;
      } else {
        const sign = Math.sign(diff) || 1;
        body.angularVelocity.set(0, sign * targetAngular.current.speed, 0);
      }
    }

    // Process command queue
    if (!busy.current && commandQueue.current.length > 0) {
      busy.current = true;
      const next = commandQueue.current.shift();
      if (next) next();
    }

    // Update sensors
    const pos = body.position;
    sensors.current.position = [pos.x, pos.y, pos.z];

    tmpQuat.current.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    tmpEuler.current.setFromQuaternion(tmpQuat.current, "XYZ");
    sensors.current.rotation = [tmpEuler.current.x, tmpEuler.current.y, tmpEuler.current.z];
    sensors.current.velocity = body.velocity.length();

    // Raycast down for distance to ground
    rayFrom.current.set(pos.x, pos.y, pos.z);
    rayTo.current.set(pos.x, pos.y - 5, pos.z);
    world.current.raycastClosest(rayFrom.current, rayTo.current, {}, rayResult.current);
    sensors.current.distanceToGround = rayResult.current.hasHit
      ? pos.y - rayResult.current.hitPointWorld.y
      : Infinity;

    // Sync mesh
    if (ref.current) {
      ref.current.position.set(pos.x, pos.y, pos.z);
      ref.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    }
  });

  // --- API ---
  const api: OboCarAPI = {
    reset: () => {
      if (carBody.current) {
        carBody.current.position.set(0, 0.2, 0);
        carBody.current.velocity.set(0, 0, 0);
        carBody.current.angularVelocity.set(0, 0, 0);
        carBody.current.quaternion.set(0, 0, 0, 1);
      }
    },
    move: (speed: number) => {
      // Only allow move if not currently rotating or moving
      commandQueue.current.push(() => {
        api.forward(speed, 0.1);
      });
    },
    rotate: (angleDeg: number) => {
      // Only allow rotate if not currently rotating or moving
      commandQueue.current.push(() => {
        api.rotateBy(angleDeg, 0.1);
      });
    },
    forward: (speed: number, duration: number) => {
      // Only allow forward if not currently rotating or moving
      commandQueue.current.push(() => {
        const now = performance.now() / 1000;
        targetLinear.current = { speed, endTime: now + duration };
        carBody.current?.wakeUp();
      });
    },
    rotateBy: (angleDeg: number, duration: number) => {
      // Only allow rotateBy if not currently rotating or moving
      commandQueue.current.push(() => {
        if (!carBody.current) return;
        const q = carBody.current.quaternion;
        const e = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(q.x, q.y, q.z, q.w),
          "XYZ"
        );
        const startYaw = e.y;
        const delta = THREE.MathUtils.degToRad(angleDeg);
        const targetYaw = startYaw + delta;

        let speed = Math.abs(delta) / Math.max(duration, 0.05);
        speed = Math.min(speed * 1.6, Math.PI * 2);

        const now = performance.now() / 1000;
        targetAngular.current = {
          speed,
          targetYaw,
          timeoutAt: now + Math.max(0.5, duration * 2),
        };
        carBody.current.wakeUp();
      });
    },
    getSensors: () => ({ ...sensors.current }),
  };

  return api;
}
