import * as THREE from "three";

export default function TrainingNets() {
  return (
    <group position={[-12, 0, -42]}>
      {/* Net structure - wireframe for a mild look */}
      <mesh position={[0, 2, -2]}>
        <boxGeometry args={[6, 4, 8]} />
        <meshStandardMaterial color="#dcd8d3" wireframe transparent opacity={0.4} />
      </mesh>
      {/* Ground mat */}
      <mesh position={[0, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color="#e8e5e1" transparent opacity={0.5} />
      </mesh>
      {/* Stumps / Target at the back */}
      <group position={[0, 0.4, -5.5]}>
        {[...Array(3)].map((_, i) => (
          <mesh key={i} position={[(i - 1) * 0.2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
            <meshStandardMaterial color="#dcd8d3" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
