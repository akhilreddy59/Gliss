'use client';

/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MotionValue } from 'motion/react';
import * as THREE from 'three';

interface ParticlesProps {
  scrollYProgress: MotionValue<number>;
}

function Particles({ scrollYProgress }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();
  
  // Responsive particle count
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 4000 : 10000;

  const { randomPositions, spherePositions, explodedPositions, diamondPositions } = useMemo(() => {
    const random = new Float32Array(count * 3);
    const sphere = new Float32Array(count * 3);
    const exploded = new Float32Array(count * 3);
    const diamond = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random (Chaotic Cloud)
      random[i3] = (Math.random() - 0.5) * 40;
      random[i3 + 1] = (Math.random() - 0.5) * 40;
      random[i3 + 2] = (Math.random() - 0.5) * 40;

      // Sphere
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 4;
      sphere[i3] = r * Math.cos(theta) * Math.sin(phi);
      sphere[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      sphere[i3 + 2] = r * Math.cos(phi);

      // Exploded (Scattered across Z)
      exploded[i3] = sphere[i3] + (Math.random() - 0.5) * 15;
      exploded[i3 + 1] = sphere[i3 + 1] + (Math.random() - 0.5) * 15;
      exploded[i3 + 2] = sphere[i3 + 2] + (Math.random() - 0.5) * 30;

      // Diamond (Octahedron shape)
      // Generate points on the surface of an octahedron
      let x = (Math.random() - 0.5) * 2;
      let y = (Math.random() - 0.5) * 2;
      let z = (Math.random() - 0.5) * 2;
      const sum = Math.abs(x) + Math.abs(y) + Math.abs(z);
      x = (x / sum) * 4;
      y = (y / sum) * 6; // Taller diamond
      z = (z / sum) * 4;
      
      diamond[i3] = x;
      diamond[i3 + 1] = y;
      diamond[i3 + 2] = z;
    }

    return {
      randomPositions: random,
      spherePositions: sphere,
      explodedPositions: exploded,
      diamondPositions: diamond
    };
  }, [count]);

  // We need a buffer to hold the current positions
  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);
  
  // Animation state
  const timeRef = useRef(0);
  const introProgressRef = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    // Intro animation (0 to 1 over 2.5 seconds)
    if (introProgressRef.current < 1) {
      introProgressRef.current += delta / 2.5;
      if (introProgressRef.current > 1) introProgressRef.current = 1;
    }
    
    // Ease out expo for intro
    const introEase = introProgressRef.current === 1 ? 1 : 1 - Math.pow(2, -10 * introProgressRef.current);
    
    const scroll = scrollYProgress.get(); // 0 to 1
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Mouse interaction
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let targetX = 0;
      let targetY = 0;
      let targetZ = 0;
      
      // Interpolate based on scroll
      if (scroll < 0.25) {
        // 0-25%: Sphere
        targetX = spherePositions[i3];
        targetY = spherePositions[i3 + 1];
        targetZ = spherePositions[i3 + 2];
      } else if (scroll < 0.5) {
        // 26-50%: Explode
        const t = (scroll - 0.25) / 0.25; // 0 to 1
        // Smoothstep
        const smoothT = t * t * (3 - 2 * t);
        targetX = THREE.MathUtils.lerp(spherePositions[i3], explodedPositions[i3], smoothT);
        targetY = THREE.MathUtils.lerp(spherePositions[i3 + 1], explodedPositions[i3 + 1], smoothT);
        targetZ = THREE.MathUtils.lerp(spherePositions[i3 + 2], explodedPositions[i3 + 2], smoothT);
      } else if (scroll < 0.75) {
        // 51-75%: Converge to Diamond
        const t = (scroll - 0.5) / 0.25;
        const smoothT = t * t * (3 - 2 * t);
        targetX = THREE.MathUtils.lerp(explodedPositions[i3], diamondPositions[i3], smoothT);
        targetY = THREE.MathUtils.lerp(explodedPositions[i3 + 1], diamondPositions[i3 + 1], smoothT);
        targetZ = THREE.MathUtils.lerp(explodedPositions[i3 + 2], diamondPositions[i3 + 2], smoothT);
      } else {
        // 76-100%: Diamond scales up
        const t = (scroll - 0.75) / 0.25;
        const scale = 1 + t * 2; // Scale up to 3x
        targetX = diamondPositions[i3] * scale;
        targetY = diamondPositions[i3 + 1] * scale;
        targetZ = diamondPositions[i3 + 2] * scale;
      }
      
      // Apply intro interpolation
      const currentTargetX = THREE.MathUtils.lerp(randomPositions[i3], targetX, introEase);
      const currentTargetY = THREE.MathUtils.lerp(randomPositions[i3 + 1], targetY, introEase);
      const currentTargetZ = THREE.MathUtils.lerp(randomPositions[i3 + 2], targetZ, introEase);
      
      // Add subtle float
      const floatOffset = Math.sin(time * 0.5 + i) * 0.1;
      
      // Mouse repulsion
      const dx = currentTargetX - mouseX;
      const dy = currentTargetY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let repulsionX = 0;
      let repulsionY = 0;
      
      if (dist < 2) {
        const force = (2 - dist) * 0.5;
        repulsionX = (dx / dist) * force;
        repulsionY = (dy / dist) * force;
      }
      
      // Smoothly move current position to target
      currentPositions[i3] = THREE.MathUtils.lerp(currentPositions[i3] || randomPositions[i3], currentTargetX + repulsionX, 0.1);
      currentPositions[i3 + 1] = THREE.MathUtils.lerp(currentPositions[i3 + 1] || randomPositions[i3 + 1], currentTargetY + floatOffset + repulsionY, 0.1);
      currentPositions[i3 + 2] = THREE.MathUtils.lerp(currentPositions[i3 + 2] || randomPositions[i3 + 2], currentTargetZ, 0.1);
      
      positions[i3] = currentPositions[i3];
      positions[i3 + 1] = currentPositions[i3 + 1];
      positions[i3 + 2] = currentPositions[i3 + 2];
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Rotate the whole system slowly
    pointsRef.current.rotation.y = time * 0.1;
    pointsRef.current.rotation.x = time * 0.05;
    
    // Change color based on scroll
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (scroll > 0.5) {
      // Transition to Amethyst #534AB7
      const t = Math.min(1, (scroll - 0.5) / 0.1);
      material.color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0x534AB7), t);
    } else {
      material.color.setHex(0xffffff);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function LandingScene({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <Particles scrollYProgress={scrollYProgress} />
      </Canvas>
    </div>
  );
}
