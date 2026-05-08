'use client';

import { Canvas } from '@react-three/fiber';
import { motion } from 'motion/react';
import { HeroParticles } from './HeroParticles';
import { ChevronRight, Database, Shield, Zap, Layers, Cpu } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full bg-vanta overflow-x-hidden selection:bg-emerald selection:text-white">
      
      {/* 3D Background Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <fog attach="fog" args={['#020205', 3, 10]} />
          <HeroParticles />
        </Canvas>
      </div>

      {/* Volumetric Lighting Overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto mt-12 md:mt-24 mb-32"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          >
            <h1 className="font-serif italic text-6xl md:text-8xl lg:text-9xl tracking-tight text-white mb-6 text-glow">
              Gliss
            </h1>
          </motion.div>
          
          <p className="font-mono text-emerald tracking-[0.3em] uppercase text-sm md:text-base mb-8">
            The Sovereign Intelligence Engine
          </p>
          
          <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
            Navigate complex product trade-offs with cinematic precision. 
            Detect logic gaps, rank values, and compute strategic paths using advanced LLM reasoning.
          </p>

          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-10 py-5 bg-white text-vanta font-mono font-bold uppercase tracking-widest overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Initialize Engine <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-emerald transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 z-0" />
          </motion.button>
        </motion.div>

        {/* Features Grid - Holographic Space Aesthetic */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          
          <FeatureCard 
            icon={<Database className="w-6 h-6 text-emerald" />}
            title="The Void: Objective Definition"
            description="State your goals in a brutalist, distraction-free terminal. The engine parses your intent with quantum precision."
            delay={0.2}
          />
          
          <FeatureCard 
            icon={<Layers className="w-6 h-6 text-cyan" />}
            title="Liquid-Glass Constraints"
            description="Lock in your parameters using interactive glassmorphism panels. Visual feedback confirms constraint boundaries."
            delay={0.4}
          />
          
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-white" />}
            title="Value Hierarchy Ranker"
            description="Drag-and-drop value ranking with heavy physics and trailing shadows. Establish the core DNA of your product."
            delay={0.6}
          />
          
          <FeatureCard 
            icon={<Cpu className="w-6 h-6 text-emerald" />}
            title="Quantum State Analysis"
            description="Powered by Gemini 3.1 Pro. The engine computes a brutal, logical analysis of your trade-offs in real-time."
            delay={0.8}
          />
          
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-rose" />}
            title="Conflict Detection"
            description="Immediate visual alerts when constraints and values are fundamentally opposed. Identify logic gaps before they become technical debt."
            delay={1.0}
          />

          <FeatureCard 
            icon={<div className="w-6 h-6 border border-white/30 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>}
            title="The Lens Effect"
            description="A custom light-lens cursor illuminates low-contrast text, bringing focus to critical data points as you navigate the holographic space."
            delay={1.2}
          />

        </div>

        {/* Deep Dive Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="w-full max-w-5xl glass-panel p-8 md:p-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif italic text-4xl md:text-5xl mb-6 text-white">Atmospheric Depth & Precision</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Gliss is not just a tool; it is an environment. Built on the principles of &quot;Cinematic Precision,&quot; it combines high-end luxury aesthetics with brutalist structure.
              </p>
              <ul className="space-y-4 font-mono text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 bg-emerald rounded-full" /> 10,000-Point Volumetric Particle Engine
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 bg-cyan rounded-full" /> Ultra-Transparent Glassmorphism UI
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 bg-white rounded-full" /> Real-time LLM Reasoning Chains
                </li>
              </ul>
            </div>
            
            <div className="relative h-64 md:h-full min-h-[300px] rounded-lg border border-white/10 overflow-hidden bg-black/50 flex items-center justify-center group">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="text-center relative z-10">
                 <p className="font-mono text-xs text-emerald tracking-widest uppercase mb-2">System Status</p>
                 <p className="font-serif italic text-3xl text-white">Ready for Assembly</p>
               </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="glass-panel p-8 group hover:border-emerald/50 transition-colors duration-500 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="mb-6 p-3 bg-white/5 inline-block rounded-lg border border-white/10 group-hover:border-emerald/30 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
