'use client';

import { useState, useEffect } from 'react';
import { CustomCursor } from '@/components/CustomCursor';
import { ParticleBackground } from '@/components/ParticleBackground';
import { DecidrApp } from '@/components/DecidrApp';
import { LandingPage } from '@/components/LandingPage';
import { CombinedLoader } from '@/components/CombinedLoader';
import { ParticleTextEffect } from '@/components/ParticleTextEffect';
import { AnimatePresence, motion } from 'motion/react';

export default function Home() {
  // 0: Heart Loader, 1: Particle Text, 2: Landing Page, 3: App
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage === 0) {
      // Simulate loading time for the initial animation
      const timer = setTimeout(() => {
        setStage(1);
      }, 3500); // 3.5 seconds
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-vanta">
      <CustomCursor />
      
      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-50"
          >
            <CombinedLoader />
          </motion.div>
        )}
        
        {stage === 1 && (
          <motion.div
            key="particle-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-40"
          >
            <ParticleTextEffect onComplete={() => setStage(2)} />
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 overflow-y-auto"
          >
            <LandingPage onLaunch={() => setStage(3)} />
          </motion.div>
        )}

        {stage === 3 && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute inset-0 z-10 overflow-y-auto"
          >
            <ParticleBackground />
            <DecidrApp />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
