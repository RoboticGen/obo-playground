/**
 * Physics Configuration for Obo-Playground
 * Defines parameters for Ammo.js physics engine
 */

export const PHYSICS_CONFIG = {
  // Gravity (m/s²)
  gravity: { x: 0, y: -9.81, z: 0 },

  // Car/Robot properties (OBO car specs)
  car: {
    mass: 0.5, // kg - reduced to prevent sinking (was 2.5)
    width: 0.15, // meters
    length: 0.2, // meters
    height: 0.08, // meters
    centerOfMass: { x: 0, y: 0.02, z: 0 },
  },

  // Wheel properties (34mm wheels from OBO car)
  wheels: {
    radius: 0.034, // 34mm from your GLB model
    width: 0.025, // wheel thickness
    mass: 0.1, // kg per wheel
    friction: 1.2, // higher = more grip
    rollingFriction: 0.1, // resistance to rolling
    restitution: 0.3, // bounciness (0 = no bounce)
    linearDamping: 0.05, // air/friction resistance
    angularDamping: 0.05, // rotational damping
  },

  // Motor properties
  motors: {
    maxTorque: 0.5, // Nm - adjust based on real robot specs
    maxAngularVelocity: 100, // rad/s - wheel rotation speed
    motorBrakeFriction: 2.0, // friction when motor stopped
  },

  // Ground properties
  ground: {
    friction: 0.8, // ground friction
    restitution: 0.3, // bounciness
    rollingFriction: 0.5, // rolling resistance
  },

  // Physics engine parameters
  physics: {
    timestep: 1 / 60, // 60Hz physics updates (same as render)
    maxSubSteps: 5, // sub-steps for accuracy
    enableCCD: true, // Continuous Collision Detection for fast objects
  },

  // Collision groups (for fine-grained collision control)
  collisionGroups: {
    CAR_BODY: 1,
    CAR_WHEELS: 2,
    OBSTACLES: 4,
    GROUND: 8,
  },
};

/**
 * Scale factor: How many Babylon.js units = 1 meter in physics
 * Babylon uses arbitrary units, so we need to define the scale
 */
export const PHYSICS_SCALE = 1; // 1 BJS unit = 1 meter

/**
 * Convert from Babylon.js units to physics units
 */
export function toPhysicsScale(value: number): number {
  return value * PHYSICS_SCALE;
}

/**
 * Convert from physics units back to Babylon.js units
 */
export function fromPhysicsScale(value: number): number {
  return value / PHYSICS_SCALE;
}
