import { Canvas, useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import { useRef, useEffect, useState, Suspense } from 'react';
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

const earthSvgUri = 'data:image/svg+xml;base64,' + btoa(`<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="256" fill="#3b82f6"/>
  <path d="M 50 100 Q 80 50 120 80 T 150 150 T 80 180 Z" fill="#22c55e"/>
  <path d="M 300 80 Q 350 40 400 90 T 450 160 T 320 190 Z" fill="#22c55e"/>
  <circle cx="220" cy="60" r="25" fill="#22c55e"/>
  <circle cx="480" cy="200" r="30" fill="#22c55e"/>
</svg>`);

const jupiterSvgUri = 'data:image/svg+xml;base64,' + btoa(`<svg width="512" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="256" fill="#e6dec3"/>
  <path d="M0 60 Q128 90 256 60 T512 60 L512 80 Q384 110 256 80 T0 80 Z" fill="#d97706"/>
  <path d="M0 130 Q128 110 256 130 T512 130 L512 170 Q384 150 256 170 T0 170 Z" fill="#b45309"/>
  <path d="M0 200 Q128 220 256 200 T512 200 L512 215 Q384 235 256 215 T0 215 Z" fill="#d97706"/>
  <circle cx="300" cy="150" r="20" fill="#ef4444"/>
</svg>`);

function EarthPlanet() {
  const tex = useTexture(earthSvgUri);
  return (
    <group>
      <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      {/* Lua (Moon) */}
      <mesh position={[0.8, 0.4, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
    </group>
  );
}

function JupiterPlanet() {
  const tex = useTexture(jupiterSvgUri);
  return (
    <group>
      <mesh><sphereGeometry args={[0.55, 32, 32]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      
      {/* Luas minúsculas orbitando externamente */}
      <mesh position={[-0.7, 0.3, 0.2]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#fcd34d" roughness={0.5} /></mesh>
      <mesh position={[0.6, -0.4, -0.2]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#e2e8f0" roughness={0.5} /></mesh>
      <mesh position={[0.2, 0.6, 0.4]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="#fdba74" roughness={0.5} /></mesh>
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
          <Suspense fallback={null}>
            {type === 'diamond' && <EarthPlanet />}
            {type === 'gem' && <JupiterPlanet />}
            {type === 'planet' && <SaturnPlanet />}
          </Suspense>
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

  // Posições base (Login) - Espalhados suavemente pelas bordas esquerdas
  let diamondPos: [number, number, number] = isMobile ? [-2.0, 3.0, -2] : [-4.5, 2.5, -2]; // Earth
  let gemPos: [number, number, number] = isMobile ? [2.0, -3.5, -2] : [-6.5, -1.0, -4]; // Jupiter
  let planetPos: [number, number, number] = isMobile ? [-2.5, -2.5, -3] : [-3.0, -3.0, -2]; // Saturn
  
  let diamondTargetScale = isMobile ? 0.5 : 0.8; // Earth (menor)
  let gemTargetScale = isMobile ? 0.8 : 1.3;     // Jupiter (maior)
  let planetTargetScale = isMobile ? 0.6 : 1.0;  // Saturn (médio)

  if (animState === 'transition') {
    // Alinhados ao lado da logo no header
    planetPos = isMobile ? [0, 1.8, 1] : [1.0, 0, 1];
    gemPos = isMobile ? [0, 0, 1] : [2.5, 0, 1];
    diamondPos = isMobile ? [0, -1.8, 1] : [4.0, 0, 1];
    
    // Escalas proporcionais também no topo
    planetTargetScale = isMobile ? 0.20 : 0.25;
    gemTargetScale = isMobile ? 0.25 : 0.32;
    diamondTargetScale = isMobile ? 0.15 : 0.20;
  } else if (animState === 'dashboard') {
    // Dashboard - Flutuando nas extremidades (mas recuados um pouco para não cortar na tela)
    diamondPos = isMobile ? [3.0, 3.8, -4] : [7.5, 3.5, -4]; // Earth (Top Right)
    gemPos = isMobile ? [-2.5, -3.8, -3] : [-6.5, -3.5, -4]; // Jupiter (Bottom Left)
    planetPos = isMobile ? [2.5, -3.2, -4] : [6.0, -3.5, -4]; // Saturn (Bottom Right)
    
    diamondTargetScale = isMobile ? 0.5 : 0.7;
    gemTargetScale = isMobile ? 0.8 : 1.2;
    planetTargetScale = isMobile ? 0.6 : 0.9;
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
