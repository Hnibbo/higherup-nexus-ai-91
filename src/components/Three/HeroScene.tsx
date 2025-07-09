import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text3D, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export const HeroScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.1;
    }
    
    if (sphereRef.current) {
      sphereRef.current.rotation.x = time * 0.3;
      sphereRef.current.rotation.z = time * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central floating sphere */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={sphereRef} position={[0, 0, -2]} scale={1.5}>
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial
            color="#6366f1"
            transparent
            opacity={0.8}
            distort={0.4}
            speed={3}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* Orbiting elements */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={1}>
        <mesh position={[-3, 1, -1]} scale={0.5}>
          <boxGeometry args={[1, 1, 1]} />
          <MeshDistortMaterial
            color="#8b5cf6"
            transparent
            opacity={0.6}
            distort={0.2}
            speed={2}
          />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={1.5} floatIntensity={2.5}>
        <mesh position={[3, -1, -1]} scale={0.7}>
          <tetrahedronGeometry args={[1]} />
          <MeshDistortMaterial
            color="#06b6d4"
            transparent
            opacity={0.7}
            distort={0.3}
            speed={2.5}
          />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={1} floatIntensity={1.8}>
        <mesh position={[0, 2.5, -3]} scale={0.4}>
          <octahedronGeometry args={[1]} />
          <MeshDistortMaterial
            color="#10b981"
            transparent
            opacity={0.5}
            distort={0.4}
            speed={1.5}
          />
        </mesh>
      </Float>

      {/* Sparkles effect */}
      <Sparkles
        count={100}
        scale={10}
        size={3}
        speed={0.5}
        color="#ffffff"
        opacity={0.6}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[10, -10, 10]} intensity={0.3} color="#8b5cf6" />
    </group>
  );
};