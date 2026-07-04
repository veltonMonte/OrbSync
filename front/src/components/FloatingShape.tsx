import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

type ShapeType = 'planet' | 'diamond' | 'gem';

interface ShapeProps {
  type: ShapeType;
  targetPosition: [number, number, number];
  targetScale?: number;
  scale?: number;
  speed?: number;
  floatIntensity?: number;
}

function EarthPlanet() {
  return (
    <group>
      {/* Oceano Azul */}
      <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshStandardMaterial color="#3b82f6" roughness={0.7} /></mesh>
      {/* Lua (Moon) */}
      <mesh position={[0.8, 0.4, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
      {/* Anel super fino para dar o estilo 'fofo/sci-fi' parecido com o saturno */}
      <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}><torusGeometry args={[0.7, 0.02, 16, 64]} /><meshStandardMaterial color="#93c5fd" roughness={0.3} /></mesh>
    </group>
  );
}

function MarsPlanet() {
  return (
    <group>
      {/* Planeta Vermelho */}
      <mesh><sphereGeometry args={[0.45, 32, 32]} /><meshStandardMaterial color="#ef4444" roughness={0.8} /></mesh>
      {/* Luas pequenas (Fobos e Deimos) */}
      <mesh position={[-0.6, 0.2, 0.2]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#fca5a5" roughness={0.6} /></mesh>
      <mesh position={[0.5, -0.3, -0.2]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="#fca5a5" roughness={0.6} /></mesh>
    </group>
  );
}

function SaturnPlanet() {
  return (
    <group>
      <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshStandardMaterial color="#f97316" roughness={0.7} /></mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}><torusGeometry args={[0.8, 0.1, 16, 64]} /><meshStandardMaterial color="#fcd34d" roughness={0.4} /></mesh>
    </group>
  )
}

function Shape({ type, targetPosition, targetScale = 1, scale = 1, speed = 2, floatIntensity = 2 }: ShapeProps) {
  const innerRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Group>(null);
  const targetPosRef = useRef(targetPosition);
  const targetScaleRef = useRef(targetScale);
  const vecPos = new THREE.Vector3();
  const vecScale = new THREE.Vector3();

  // Atualiza as refs quando as props mudarem
  useEffect(() => {
    targetPosRef.current = targetPosition;
    targetScaleRef.current = targetScale;
  }, [targetPosition, targetScale]);

  // Seta a posição inicial APENAS na primeira vez para não voar do 0,0,0
  useEffect(() => {
    if (outerRef.current) {
      outerRef.current.position.set(...targetPosition);
      outerRef.current.scale.set(targetScale, targetScale, targetScale);
    }
  }, []);

  useFrame((_state, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.x += delta * 0.1 * speed;
      innerRef.current.rotation.y += delta * 0.15 * speed;
    }
    if (outerRef.current) {
      // Lerp (smooth move) towards target position
      vecPos.set(...targetPosRef.current);
      outerRef.current.position.lerp(vecPos, delta * 3);

      // Lerp towards target scale
      vecScale.set(targetScaleRef.current, targetScaleRef.current, targetScaleRef.current);
      outerRef.current.scale.lerp(vecScale, delta * 3);
    }
  });

  return (
    <group ref={outerRef}>
      <Float speed={speed} rotationIntensity={0.5} floatIntensity={floatIntensity}>
        <group ref={innerRef} scale={scale}>
          {type === 'diamond' && <EarthPlanet />}
          {type === 'gem' && <MarsPlanet />}
          {type === 'planet' && <SaturnPlanet />}
        </group>
      </Float>
    </group>
  );
}

export function Floating3DBackground() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [animState, setAnimState] = useState<'login' | 'transition' | 'dashboard'>('login');

  useEffect(() => {
    // Se o usuário logou, faz a animação para o logo, e depois para o dashboard
    if (isAuthenticated) {
      setAnimState('transition');
      const timer = setTimeout(() => {
        setAnimState('dashboard');
      }, 3500); // 3.5s na transição (espera 1s a mais)
      return () => clearTimeout(timer);
    } else {
      setAnimState('login');
    }
  }, [isAuthenticated]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Definindo posições e tamanhos baseados no estado
  let diamondPos: [number, number, number] = isMobile ? [-2.0, 1.0, -2] : [-3.5, 1.0, -2];
  let gemPos: [number, number, number] = isMobile ? [-3.0, -1.5, -1] : [-6.0, -1.5, -1];
  let planetPos: [number, number, number] = isMobile ? [-1.5, -2.5, -3] : [-2.5, -2.5, -3];
  
  let diamondTargetScale = isMobile ? 0.6 : 1;
  let gemTargetScale = isMobile ? 0.6 : 1;
  let planetTargetScale = isMobile ? 0.6 : 1;

  if (animState === 'transition') {
    // Alinhados lado a lado, na direita da logo.
    // Espaçados para evitar que os objetos encostem
    planetPos = isMobile ? [0, 1.8, 1] : [1.0, 0, 1];
    gemPos = isMobile ? [0, 0, 1] : [2.4, 0, 1];
    diamondPos = isMobile ? [0, -1.8, 1] : [3.8, 0, 1];
    
    // Escalas ajustadas individualmente para que fiquem EXATAMENTE do mesmo tamanho visual
    planetTargetScale = isMobile ? 0.25 : 0.38; 
    gemTargetScale = isMobile ? 0.18 : 0.25;
    diamondTargetScale = isMobile ? 0.2 : 0.3;
  } else if (animState === 'dashboard') {
    // Se espalham pelas extremidades
    diamondPos = isMobile ? [3.0, 3.5, -4] : [8.5, 3.5, -4]; 
    gemPos = isMobile ? [-3.5, -3.5, -3] : [-8.5, -3.5, -3];   
    planetPos = isMobile ? [-3.0, 3.5, -3] : [-7.5, 3.5, -3]; 
    diamondTargetScale = isMobile ? 0.6 : 1;
    gemTargetScale = isMobile ? 0.6 : 1;
    planetTargetScale = isMobile ? 0.6 : 1;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]}>
        {/* Moderate lighting for balanced shadows and colors */}
        <ambientLight intensity={2} color="#ffffff" />
        <hemisphereLight color="#ffffff" groundColor="#c084fc" intensity={1} />
        
        {/* Subtle highlights */}
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={1} color="#4f46e5" />
        
        {/* Soft backlight */}
        <pointLight position={[0, 0, -5]} intensity={1.5} color="#ffffff" />

        <Shape 
          type="diamond" 
          targetPosition={diamondPos} 
          targetScale={diamondTargetScale}
          scale={1.2} 
          speed={0.3} 
          floatIntensity={1.5} 
        />

        <Shape 
          type="gem" 
          targetPosition={gemPos} 
          targetScale={gemTargetScale}
          scale={1.4} 
          speed={0.4} 
          floatIntensity={2} 
        />

        <Shape 
          type="planet" 
          targetPosition={planetPos} 
          targetScale={planetTargetScale}
          scale={1.2} 
          speed={0.5} 
          floatIntensity={2} 
        />
      </Canvas>
    </div>
  );
}

function MiniPlanetScene() {
  const innerRef = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.x += delta * 0.2;
      innerRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <group ref={innerRef} scale={1.5}>
      <SaturnPlanet />
    </group>
  );
}

export function MiniPlanetCanvas() {
  return (
    <div style={{ width: '44px', height: '44px', marginLeft: '0.5rem', flexShrink: 0 }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={2.2} color="#ffffff" />
        <hemisphereLight color="#ffffff" groundColor="#c084fc" intensity={1} />
        <directionalLight position={[2, 5, 2]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-2, -2, -2]} intensity={1} color="#4f46e5" />
        <MiniPlanetScene />
      </Canvas>
    </div>
  );
}
