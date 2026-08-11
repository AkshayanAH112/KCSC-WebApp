import * as THREE from "three";

export const PHASES = {
  // Hero (0 - 0.16)
  heroPrepare: 0.03,
  heroImpact: 0.08,
  heroLaunch: 0.16,
  
  // About / Ground (0.16 - 0.33)
  groundBounce: 0.22,
  groundRoll: 0.33,
  
  // Programs / Nets (0.33 - 0.50)
  netsEnter: 0.40,
  netsRest: 0.50,

  // Teams / Equipment (0.50 - 0.66)
  equipEnter: 0.58,
  equipRest: 0.66,

  // Achievements / Trophy (0.66 - 0.83)
  trophyRise: 0.75,
  trophyPeak: 0.83,

  // Final CTA / Crest (0.83 - 1.0)
  crestApproach: 0.92,
  crestSettle: 1.0,
};

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpVec3(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
  return out;
}

// -----------------------------------------------------------------------------
// BALL PATH
// -----------------------------------------------------------------------------
export const CONTACT_POINT = new THREE.Vector3(0.42, -0.08, 1.1);

// We define a single large spline for the ball's journey
const ballCurve = new THREE.CatmullRomCurve3([
  // Hero
  new THREE.Vector3(1.4, 2.2, 15),       // 0.0 (Delivery)
  new THREE.Vector3(1.0, 1.4, 9),        // 0.03
  CONTACT_POINT,                         // 0.08 (Impact)
  
  // Ground (About)
  new THREE.Vector3(-1.8, 4.2, -8),      // 0.16 (High launch)
  new THREE.Vector3(-4.0, 0.14, -20),    // About (Ground)
  new THREE.Vector3(-3.0, 0.14, -18),    // 0.25 (Bouncing)
  new THREE.Vector3(-7.0, 0.14, -34),    // 0.35 (Rolling)
  
  // Programs (Nets)
  new THREE.Vector3(-12.0, 0.14, -40),   // 0.45
  new THREE.Vector3(-14.0, 0.14, -46),   // 0.55 (Slowing down)
  
  // Empty space / Flying (Achievements)
  new THREE.Vector3(-22.0, 1.5, -62),    // 0.70
  new THREE.Vector3(-24.0, 1.5, -68),    // 0.80
  
  // Final flight (Final CTA)
  new THREE.Vector3(-26.0, 1.5, -74),    // 0.90
  new THREE.Vector3(-28.0, 1.5, -80),    // 1.00
]);

export interface BallState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  opacity: number;
  trailStrength: number;
}

export function getBallState(progress: number, out: BallState): BallState {
  ballCurve.getPointAt(smoothstep(progress), out.position);
  
  out.rotation.set(progress * 40, progress * 60, progress * 20);
  
  out.opacity = 1;
  
  const distFromImpact = Math.abs(progress - PHASES.heroImpact);
  out.trailStrength = progress > 0.08 ? clamp01(1 - distFromImpact / 0.15) : 0;
  
  if (progress > 0.2) out.trailStrength = 0.2;

  return out;
}

export function sampleTrailPoint(progress: number, offset: number, out: THREE.Vector3) {
  return ballCurve.getPointAt(smoothstep(clamp01(progress - offset)), out);
}

// -----------------------------------------------------------------------------
// BAT
// -----------------------------------------------------------------------------
const BAT_REST_ANGLE = 1.1;
const BAT_CONTACT_ANGLE = -0.35;
const BAT_FOLLOW_THROUGH_ANGLE = -0.65;

export function getBatSwingAngle(progress: number): number {
  if (progress <= PHASES.heroPrepare) return BAT_REST_ANGLE;
  if (progress <= PHASES.heroImpact) {
    const t = smoothstep((progress - PHASES.heroPrepare) / (PHASES.heroImpact - PHASES.heroPrepare));
    return lerp(BAT_REST_ANGLE, BAT_CONTACT_ANGLE, t);
  }
  if (progress <= PHASES.heroLaunch) {
    const t = smoothstep((progress - PHASES.heroImpact) / (PHASES.heroLaunch - PHASES.heroImpact));
    return lerp(BAT_CONTACT_ANGLE, BAT_FOLLOW_THROUGH_ANGLE, t);
  }
  return BAT_FOLLOW_THROUGH_ANGLE;
}

export function getImpactIntensity(progress: number): number {
  const window = 0.02;
  const dist = Math.abs(progress - PHASES.heroImpact);
  return dist > window ? 0 : 1 - dist / window;
}

// -----------------------------------------------------------------------------
// CAMERA
// -----------------------------------------------------------------------------
const camPositionKeyframes: { p: number; pos: THREE.Vector3 }[] = [
  // Hero (Original sweeping path)
  { p: 0.00, pos: new THREE.Vector3(3.2, 2.6, 17) },
  { p: 0.03, pos: new THREE.Vector3(2.6, 1.8, 10.5) },
  { p: 0.08, pos: new THREE.Vector3(1.6, 0.7, 3.2) },
  { p: 0.18, pos: new THREE.Vector3(1.1, 1.9, 0.2) },
];

const targetLookScratch = new THREE.Vector3();

export function getCameraState(
  progress: number,
  mouseX: number,
  mouseY: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
) {
  // Always look at the ball (slightly ahead)
  ballCurve.getPointAt(smoothstep(clamp01(progress + 0.02)), targetLookScratch);
  outLook.copy(targetLookScratch);

  if (progress <= 0.18) {
    // Hero phase: use keyframes
    let i = 0;
    while (i < camPositionKeyframes.length - 2 && progress > camPositionKeyframes[i + 1].p) i++;
    const a = camPositionKeyframes[i];
    const b = camPositionKeyframes[i + 1];
    const span = b.p - a.p || 1;
    const t = smoothstep((progress - a.p) / span);
    lerpVec3(outPos, a.pos, b.pos, t);
  } else {
    // After Hero phase: dynamically follow the ball at a constant offset.
    // Setting Y to 2.2 puts the ball near the bottom of the screen.
    // Setting X to -2.0 puts the ball towards the right edge.
    // This perfectly prevents the ball from overlapping any reading text!
    
    // As we enter the Final CTA (p > 0.8), pan camera so the ball rests
    // beautifully in the center, right below the final Join button.
    let currentOffsetX = -2.0;
    let currentOffsetY = 2.2;
    let currentOffsetZ = 4.0;
    
    if (progress > 0.8) {
      const pFinal = Math.min(1, (progress - 0.8) / 0.15); // completes by 0.95
      const easePFinal = smoothstep(pFinal);
      currentOffsetX = lerp(-2.0, 0.0, easePFinal); // Center horizontally
      currentOffsetY = lerp(2.2, 3.2, easePFinal); // Move camera up so ball sits low
      currentOffsetZ = lerp(4.0, 6.5, easePFinal); // Pull back for a cinematic ending
    }
    
    const followOffset = new THREE.Vector3(currentOffsetX, currentOffsetY, currentOffsetZ);
    
    // Smoothly transition from the last keyframe to the dynamic follow offset
    const transitionEnd = 0.26;
    if (progress < transitionEnd) {
      const t = smoothstep((progress - 0.18) / (transitionEnd - 0.18));
      const startPos = camPositionKeyframes[camPositionKeyframes.length - 1].pos;
      const targetPos = targetLookScratch.clone().add(followOffset);
      lerpVec3(outPos, startPos, targetPos, t);
    } else {
      outPos.copy(targetLookScratch).add(followOffset);
    }
  }

  const parallaxX = clamp01(Math.abs(mouseX)) * Math.sign(mouseX) * 0.22;
  const parallaxY = clamp01(Math.abs(mouseY)) * Math.sign(mouseY) * -0.12;
  outPos.x += parallaxX;
  outPos.y += parallaxY;
  outLook.x += parallaxX * 0.4;
  outLook.y += parallaxY * 0.4;

  return { position: outPos, lookAt: outLook };
}
