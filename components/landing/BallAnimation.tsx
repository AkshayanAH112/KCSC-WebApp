"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getBallState, getImpactIntensity, sampleTrailPoint, type BallState } from "@/lib/pageStory";

export interface StoryRef {
  scroll: number;
  mouseX: number;
  mouseY: number;
  reducedMotion: boolean;
  mouseEnabled: boolean;
}

const TRAIL_LENGTH = 16;

export default function CricketBall({ storyRef }: { storyRef: React.RefObject<StoryRef> }) {
  const ballRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const trailRef = useRef<THREE.Line>(null);

  const state = useMemo<BallState>(
    () => ({ position: new THREE.Vector3(), rotation: new THREE.Euler(), opacity: 1, trailStrength: 0 }),
    []
  );

  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const colors = new Float32Array(TRAIL_LENGTH * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, []);

  const gold = useMemo(() => new THREE.Color("#d4af6a"), []);
  const trailPoint = useMemo(() => new THREE.Vector3(), []);

  const trailLine = useMemo(
    () => new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 })),
    [trailGeometry]
  );

  useFrame(() => {
    const story = storyRef.current;
    if (!story || !ballRef.current) return;

    getBallState(story.scroll, state);
    ballRef.current.position.copy(state.position);
    // Subtle, clamped mouse-driven bend of the trajectory (not a hard follow).
    ballRef.current.position.x += story.mouseX * 0.15;
    ballRef.current.position.y += story.mouseY * 0.08;
    ballRef.current.rotation.copy(state.rotation);

    const scale = 0.85 + state.opacity * 0.15;
    ballRef.current.scale.setScalar(scale);
    ballRef.current.visible = state.opacity > 0.02;

    if (materialRef.current) {
      materialRef.current.opacity = state.opacity;
      // Only blend when actually fading (opacity < 1) — keeping `transparent`
      // off otherwise avoids Three.js's transparent-blend pass washing out
      // the leather color at full opacity.
      materialRef.current.transparent = state.opacity < 0.98;
      // A brief golden glint right at contact, not a sustained glow — a real
      // narrow window (getImpactIntensity) rather than the broad trail curve.
      materialRef.current.emissiveIntensity = 0.03 + getImpactIntensity(story.scroll) * 0.4;
    }

    // Fading gold trail: sample a handful of recent positions along the same
    // deterministic curve so it reverses cleanly when the user scrolls back up.
    if (trailRef.current) {
      const positions = trailGeometry.attributes.position as THREE.BufferAttribute;
      const colors = trailGeometry.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        sampleTrailPoint(story.scroll, (i / TRAIL_LENGTH) * 0.12, trailPoint);
        positions.setXYZ(i, trailPoint.x, trailPoint.y, trailPoint.z);
        const fade = (1 - i / TRAIL_LENGTH) * state.trailStrength;
        colors.setXYZ(i, gold.r * fade, gold.g * fade, gold.b * fade);
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      (trailRef.current.material as THREE.LineBasicMaterial).opacity = state.trailStrength * 0.8;
      trailRef.current.visible = state.trailStrength > 0.03;
    }
  });

  return (
    <>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshPhysicalMaterial
          ref={materialRef}
          color="#6b1414"
          roughness={0.4}
          metalness={0.04}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
          emissive="#d4af6a"
          emissiveIntensity={0.03}
          transparent
        />
        {/* Seam stitching */}
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[0.282, 0.007, 8, 48]} />
          <meshStandardMaterial color="#f3e4c7" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2.6, Math.PI / 5]}>
          <torusGeometry args={[0.282, 0.005, 8, 48]} />
          <meshStandardMaterial color="#e8dcc4" roughness={0.9} />
        </mesh>
      </mesh>

      <primitive object={trailLine} ref={trailRef} />
    </>
  );
}
