import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const FloatingShapes = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);
  const mesh3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.3;
      meshRef.current.rotation.y = time * 0.4;
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.x = time * 0.2;
      mesh2Ref.current.rotation.z = time * 0.3;
    }
    if (mesh3Ref.current) {
      mesh3Ref.current.rotation.y = time * 0.5;
      mesh3Ref.current.rotation.z = time * 0.2;
    }
  });

  return (
    <>
      <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef} position={[-4, 2, -3]} scale={0.8}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshDistortMaterial
            color="#3b82f6"
            transparent
            opacity={0.6}
            distort={0.3}
            speed={2}
          />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={1} floatIntensity={1.5}>
        <mesh ref={mesh2Ref} position={[4, -2, -2]} scale={0.6}>
          <octahedronGeometry args={[1]} />
          <MeshDistortMaterial
            color="#8b5cf6"
            transparent
            opacity={0.4}
            distort={0.4}
            speed={3}
          />
        </mesh>
      </Float>

      <Float speed={0.8} rotationIntensity={2} floatIntensity={3}>
        <mesh ref={mesh3Ref} position={[2, 3, -4]} scale={1.2}>
          <tetrahedronGeometry args={[1]} />
          <MeshDistortMaterial
            color="#06b6d4"
            transparent
            opacity={0.5}
            distort={0.2}
            speed={1.5}
          />
        </mesh>
      </Float>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </>
  );
};