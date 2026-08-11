import * as THREE from "three";

export default function CricketGround() {
  return (
    <group position={[-5, -0.05, -25]}>
      {/* Subtle pitch area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 80]} />
        <meshStandardMaterial color="#e8e5e1" roughness={1} opacity={0.4} transparent />
      </mesh>
      {/* Boundary rope (subtle white) */}
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[25, 0.1, 8, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} opacity={0.8} transparent />
      </mesh>
    </group>
  );
}
