"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getBatSwingAngle, CONTACT_POINT } from "@/lib/pageStory";
import type { StoryRef } from "./BallAnimation";

export default function CricketBat({ storyRef }: { storyRef: React.RefObject<StoryRef> }) {
  const groupRef = useRef<THREE.Group>(null);

  // Pale willow wood, like a real cricket bat, with a dark rubber-grip handle.
  const woodMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e8dcc0", roughness: 0.5, metalness: 0.02 }),
    []
  );
  const trimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d4af6a", roughness: 0.35, metalness: 0.5 }),
    []
  );
  const handleMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a1f0a", roughness: 0.75 }),
    []
  );

  useFrame(() => {
    const story = storyRef.current;
    if (!story || !groupRef.current) return;
    groupRef.current.rotation.z = getBatSwingAngle(story.scroll);
  });

  return (
    <group
      ref={groupRef}
      position={[CONTACT_POINT.x - 0.05, CONTACT_POINT.y - 0.55, CONTACT_POINT.z - 0.05]}
      scale={1.3}
    >
      {/* Blade */}
      <mesh material={woodMaterial} position={[0, 0.55, 0]}>
        <boxGeometry args={[0.18, 0.85, 0.06]} />
      </mesh>
      {/* Gold trim band, brand accent where blade meets shoulder */}
      <mesh material={trimMaterial} position={[0, 0.955, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
      </mesh>
      {/* Shoulder taper */}
      <mesh material={woodMaterial} position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.05, 0.09, 0.14, 12]} />
      </mesh>
      {/* Handle */}
      <mesh material={handleMaterial} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.42, 12]} />
      </mesh>
    </group>
  );
}
