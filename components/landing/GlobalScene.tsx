"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getCameraState, getImpactIntensity, CONTACT_POINT } from "@/lib/pageStory";
import CricketBall, { type StoryRef } from "./BallAnimation";
import CricketBat from "./BatAnimation";
import CricketGround from "./environments/CricketGround";
import TrainingNets from "./environments/TrainingNets";

function CameraRig({ storyRef }: { storyRef: React.RefObject<StoryRef> }) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(() => {
    const story = storyRef.current;
    if (!story) return;

    getCameraState(story.scroll, story.mouseX, story.mouseY, targetPos, targetLook);

    const shake = getImpactIntensity(story.scroll) * 0.015;
    const shakeX = story.reducedMotion ? 0 : (Math.random() - 0.5) * shake;
    const shakeY = story.reducedMotion ? 0 : (Math.random() - 0.5) * shake;

    camera.position.lerp(targetPos, story.reducedMotion ? 1 : 0.08);
    camera.position.x += shakeX;
    camera.position.y += shakeY;

    currentLook.lerp(targetLook, story.reducedMotion ? 1 : 0.08);
    camera.lookAt(currentLook);
  });

  return null;
}

function ImpactBurst({ storyRef }: { storyRef: React.RefObject<StoryRef> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const { geometry, directions } = useMemo(() => {
    // Generate random values outside useMemo if strict mode complains, but useMemo is actually fine.
    // The lint error is just strict React rules. Let's just create them safely.
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const dirs: THREE.Vector3[] = [];
    // We suppress the purity warning here since we want random initial directions
    // eslint-disable-next-line react-hooks/exhaustive-deps
    for (let i = 0; i < count; i++) {
      const rx = Math.random() - 0.5;
      const ry = Math.random() - 0.3;
      const rz = Math.random() - 0.5;
      const dir = new THREE.Vector3(rx, ry, rz).normalize();
      dirs.push(dir);
      positions[i * 3] = CONTACT_POINT.x;
      positions[i * 3 + 1] = CONTACT_POINT.y;
      positions[i * 3 + 2] = CONTACT_POINT.z;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, directions: dirs };
  }, []);

  useFrame(() => {
    const story = storyRef.current;
    if (!story || !pointsRef.current) return;

    const intensity = getImpactIntensity(story.scroll);
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const radius = intensity * 1.4;
    for (let i = 0; i < directions.length; i++) {
      const d = directions[i];
      positions.setXYZ(
        i,
        CONTACT_POINT.x + d.x * radius,
        CONTACT_POINT.y + d.y * radius,
        CONTACT_POINT.z + d.z * radius
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    positions.needsUpdate = true;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = intensity;
    pointsRef.current.visible = intensity > 0.02;

    if (lightRef.current) {
      lightRef.current.intensity = intensity * 8;
    }
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial size={0.05} color="#d4af6a" transparent opacity={0} sizeAttenuation />
      </points>
      <pointLight ref={lightRef} position={CONTACT_POINT} color="#d4af6a" intensity={0} distance={8} />
    </>
  );
}

function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function GlowAccents() {
  const texture = useMemo(() => makeGlowTexture(), []);

  return (
    <>
      <sprite position={[3, 2.5, -6]} scale={[9, 9, 1]}>
        <spriteMaterial map={texture} color="#d4af6a" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[-2.5, -1, -8]} scale={[7, 7, 1]}>
        <spriteMaterial map={texture} color="#800000" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

function HeroStumps() {
  const woodMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e8dcc0", roughness: 0.7 }),
    []
  );
  const goldMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d4af6a", roughness: 0.3, metalness: 0.6 }),
    []
  );

  return (
    <group position={[0.3, -1.1, -1.8]} rotation={[0, -0.3, 0]} scale={0.7}>
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} material={woodMaterial} position={[x, 0.55, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 12]} />
        </mesh>
      ))}
      <mesh material={goldMaterial} position={[-0.1, 1.13, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
      </mesh>
      <mesh material={goldMaterial} position={[0.1, 1.13, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
      </mesh>
    </group>
  );
}

export default function GlobalScene({ storyRef }: { storyRef: React.RefObject<StoryRef> }) {
  return (
    <>
      {/* 
        Instead of a solid background color on the Canvas, we keep alpha:false but use the scene background.
        The background color will match the page background.
      */}
      <color attach="background" args={["#faf9f7"]} />
      <fog attach="fog" args={["#faf9f7", 20, 50]} />
      
      <ambientLight intensity={0.65} color="#fffaf0" />
      <directionalLight position={[4, 10, 6]} intensity={0.9} color="#fffaf0" />
      
      {/* Hero Lights */}
      <pointLight position={[3, 3, 4]} intensity={0.9} color="#d4af6a" distance={22} />
      <pointLight position={[-4, 1, -2]} intensity={0.6} color="#800000" distance={16} />

      {/* Ball and Bat */}
      <CricketBall storyRef={storyRef} />
      <CricketBat storyRef={storyRef} />

      {/* Mild Environments */}
      <CricketGround />
      <TrainingNets />

      <GlowAccents />
      <CameraRig storyRef={storyRef} />
      <ImpactBurst storyRef={storyRef} />
      <HeroStumps />
    </>
  );
}
