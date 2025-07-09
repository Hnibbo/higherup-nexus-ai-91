import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text3D, Float, Sparkles, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { motion } from 'framer-motion';

interface NextGenInteractive3DProps {
  className?: string;
}

const AdvancedGeometry = () => {
  const meshRef = useRef<Mesh>(null);
  const mesh2Ref = useRef<Mesh>(null);
  const mesh3Ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.cos(t / 4) / 2;
      meshRef.current.rotation.y = Math.sin(t / 4) / 2;
      meshRef.current.position.y = Math.sin(t) / 10;
    }
    
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.x = Math.sin(t / 3) / 2;
      mesh2Ref.current.rotation.z = Math.cos(t / 2) / 2;
    }
    
    if (mesh3Ref.current) {
      mesh3Ref.current.rotation.y = t / 2;
      mesh3Ref.current.position.x = Math.cos(t) * 2;
      mesh3Ref.current.position.z = Math.sin(t) * 2;
    }
  });

  return (
    <>
      {/* Central Interactive Sphere */}
      <Float speed={1} rotationIntensity={1} floatIntensity={2}>
        <mesh 
          ref={meshRef} 
          position={[0, 0, 0]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.2 : 1}
        >
          <icosahedronGeometry args={[1, 1]} />
          <MeshDistortMaterial
            color={hovered ? "#8b5cf6" : "#6366f1"}
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* Orbiting Elements */}
      <Float speed={0.8} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={mesh2Ref} position={[3, 1, 0]}>
          <torusGeometry args={[0.5, 0.2, 16, 100]} />
          <MeshWobbleMaterial
            color="#f59e0b"
            attach="material"
            factor={1}
            speed={10}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh ref={mesh3Ref} position={[-2, -1, 1]} scale={0.7}>
          <octahedronGeometry args={[1]} />
          <MeshDistortMaterial
            color="#10b981"
            attach="material"
            distort={0.4}
            speed={3}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </Float>

      {/* Interactive Particles */}
      <Sparkles
        count={100}
        scale={[10, 10, 10]}
        size={3}
        speed={0.4}
        color="#8b5cf6"
      />
      
      {/* Ambient Effects */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f59e0b" />
      <directionalLight position={[0, 0, 5]} intensity={0.8} />
    </>
  );
};

export const NextGenInteractive3D = ({ className = "" }: NextGenInteractive3DProps) => {
  return (
    <motion.div 
      className={`w-full h-full ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <Environment preset="city" />
        <AdvancedGeometry />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </motion.div>
  );
};

export default NextGenInteractive3D;