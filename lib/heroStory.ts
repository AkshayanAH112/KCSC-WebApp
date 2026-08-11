import * as THREE from "three";

// Scroll-progress milestones (0-1) that drive the hero's cinematic sequence.
// Every value below is a pure function of `progress` — nothing is accumulated
// frame-to-frame, so scrubbing backward through the scroll reverses cleanly.
export const PHASES = {
  prepareStart: 0.18,
  impactPeak: 0.43,
  impactEnd: 0.48,
  launchEnd: 0.62,
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

// Ball travels from a distant "delivery" point down to the bat, then launches
// away into the depth of the scene after impact. The camera keyframes below
// are deliberately positioned so the ball's whole path stays inside the
// view frustum at every progress value (verified against these exact points).
const approachCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.4, 2.2, 15),
  new THREE.Vector3(1.0, 1.4, 9),
  new THREE.Vector3(0.6, 0.4, 3.5),
  new THREE.Vector3(0.42, -0.08, 1.1),
]);

const launchCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.42, -0.08, 1.1),
  new THREE.Vector3(-0.6, 1.6, -2.5),
  new THREE.Vector3(-1.8, 3.2, -8),
  new THREE.Vector3(-3.2, 4.6, -16),
]);

export const CONTACT_POINT = new THREE.Vector3(0.42, -0.08, 1.1);

function sampleBallPosition(progress: number, out: THREE.Vector3) {
  if (progress <= PHASES.impactPeak) {
    approachCurve.getPointAt(smoothstep(progress / PHASES.impactPeak), out);
  } else if (progress <= PHASES.launchEnd) {
    launchCurve.getPointAt(
      smoothstep((progress - PHASES.impactPeak) / (PHASES.launchEnd - PHASES.impactPeak)),
      out
    );
  } else {
    launchCurve.getPointAt(1, out);
  }
  return out;
}

export interface BallState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  opacity: number;
  trailStrength: number;
}

export function getBallState(progress: number, out: BallState): BallState {
  sampleBallPosition(progress, out.position);

  out.rotation.set(progress * 18, progress * 30, progress * 6);

  // Fade the ball out as it disappears into the distance after launch.
  out.opacity = progress > PHASES.launchEnd ? clamp01(1 - (progress - PHASES.launchEnd) / (1 - PHASES.launchEnd)) : 1;

  const distFromImpact = Math.abs(progress - PHASES.impactPeak);
  out.trailStrength = clamp01(1 - distFromImpact / 0.28);

  return out;
}

export function sampleTrailPoint(progress: number, offset: number, out: THREE.Vector3) {
  return sampleBallPosition(clamp01(progress - offset), out);
}

const BAT_REST_ANGLE = 1.1;
const BAT_CONTACT_ANGLE = -0.35;
const BAT_FOLLOW_THROUGH_ANGLE = -0.65;

export function getBatSwingAngle(progress: number): number {
  if (progress <= PHASES.prepareStart) return BAT_REST_ANGLE;
  if (progress <= PHASES.impactPeak) {
    const t = smoothstep((progress - PHASES.prepareStart) / (PHASES.impactPeak - PHASES.prepareStart));
    return lerp(BAT_REST_ANGLE, BAT_CONTACT_ANGLE, t);
  }
  if (progress <= PHASES.impactEnd) {
    const t = smoothstep((progress - PHASES.impactPeak) / (PHASES.impactEnd - PHASES.impactPeak));
    return lerp(BAT_CONTACT_ANGLE, BAT_FOLLOW_THROUGH_ANGLE, t);
  }
  return BAT_FOLLOW_THROUGH_ANGLE;
}

export function getImpactIntensity(progress: number): number {
  const window = 0.07;
  const dist = Math.abs(progress - PHASES.impactPeak);
  return dist > window ? 0 : 1 - dist / window;
}

// Camera dolly path — position only. The camera always *looks at* the ball's
// current position (computed live, not a separate hand-tuned keyframe list),
// so framing can never drift out of sync with where the ball actually is.
const camPositionKeyframes: { p: number; pos: THREE.Vector3 }[] = [
  { p: 0.0, pos: new THREE.Vector3(3.2, 2.6, 17) },
  { p: 0.2, pos: new THREE.Vector3(2.6, 1.8, 10.5) },
  { p: 0.35, pos: new THREE.Vector3(2.0, 1.1, 5.5) },
  { p: 0.45, pos: new THREE.Vector3(1.6, 0.7, 3.2) },
  { p: 0.62, pos: new THREE.Vector3(1.1, 1.9, 0.2) },
  { p: 1.0, pos: new THREE.Vector3(0.4, 2.6, -4.5) },
];

const ballLookScratch = new THREE.Vector3();

export function getCameraState(
  progress: number,
  mouseX: number,
  mouseY: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
) {
  let i = 0;
  while (i < camPositionKeyframes.length - 2 && progress > camPositionKeyframes[i + 1].p) i++;

  const a = camPositionKeyframes[i];
  const b = camPositionKeyframes[i + 1];
  const span = b.p - a.p || 1;
  const t = smoothstep((progress - a.p) / span);

  lerpVec3(outPos, a.pos, b.pos, t);

  // The camera always looks at the ball's live position — guarantees the
  // subject is framed correctly at every scroll position.
  sampleBallPosition(progress, ballLookScratch);
  outLook.copy(ballLookScratch);

  // Subtle, clamped mouse parallax layered on top of the scroll-driven path.
  const parallaxX = clamp01(Math.abs(mouseX)) * Math.sign(mouseX) * 0.22;
  const parallaxY = clamp01(Math.abs(mouseY)) * Math.sign(mouseY) * -0.12;
  outPos.x += parallaxX;
  outPos.y += parallaxY;
  outLook.x += parallaxX * 0.4;
  outLook.y += parallaxY * 0.4;

  return { position: outPos, lookAt: outLook };
}
