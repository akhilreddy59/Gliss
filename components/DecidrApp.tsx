'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import Markdown from 'react-markdown';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, ChevronRight, Cpu, Terminal, Zap } from 'lucide-react';

// --- Types ---
type Stage = 'objective' | 'constraints' | 'ranker' | 'dashboard';

interface Constraint {
  id: string;
  label: string;
  selected: boolean;
}

interface ValueItem {
  id: string;
  label: string;
}

interface AIResponse {
  conflict_severity: number;
  logic_gaps: string[];
  recommendations: {
    path: string;
    tradeoffs: string[];
    score: number;
  }[];
  prd?: string;
  ui_ux_suggestion?: string;
}

// --- Sortable Item Component ---
function SortableItem({ id, label }: { id: string; label: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-4 mb-3 glass-panel rounded-lg cursor-grab active:cursor-grabbing flex items-center justify-between group transition-all duration-300 ${
          isDragging ? 'shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-105 border-emerald' : 'hover:scale-[1.02] hover:border-white/30'
        }`}
      >
        <span className="text-gray-400 group-hover:text-white transition-colors duration-300 font-mono text-sm uppercase tracking-widest">{label}</span>
        <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-emerald transition-colors">
          <div className="w-2 h-2 bg-white/20 rounded-full group-hover:bg-emerald transition-colors" />
        </div>
      </div>
  );
}

// --- Main App Component ---
export function DecidrApp() {
  const [stage, setStage] = useState<Stage>('objective');
  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: 'c1', label: 'Time to Market < 3 Months', selected: false },
    { id: 'c2', label: 'Zero Technical Debt', selected: false },
    { id: 'c3', label: 'Budget < $50k', selected: false },
    { id: 'c4', label: 'Enterprise Security', selected: false },
    { id: 'c5', label: 'Scalable to 1M Users', selected: false },
    { id: 'c6', label: 'Perfect UX/UI', selected: false },
  ]);
  const [values, setValues] = useState<ValueItem[]>([
    { id: 'v1', label: 'Speed' },
    { id: 'v2', label: 'Quality' },
    { id: 'v3', label: 'Cost' },
    { id: 'v4', label: 'Scope' },
  ]);
  const [generatePrd, setGeneratePrd] = useState(false);
  const [suggestUiUx, setSuggestUiUx] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isObjectiveValid = objective.trim().length >= 15;
  const showObjectiveError = objective.length > 0 && !isObjectiveValid;

  const addToLog = (msg: string) => {
    setAuditLog(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setValues((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleConstraint = (id: string) => {
    setConstraints(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setStage('dashboard');
    addToLog('INITIALIZING SOVEREIGN INTELLIGENCE ENGINE...');
    addToLog(`OBJECTIVE: ${objective}`);
    
    const selectedConstraints = constraints.filter(c => c.selected).map(c => c.label);
    addToLog(`CONSTRAINTS DETECTED: ${selectedConstraints.length}`);
    addToLog(`VALUE HIERARCHY LOCKED: ${values.map(v => v.label).join(' > ')}`);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      addToLog('ESTABLISHING NEURAL LINK TO GEMINI...');
      
      const prompt = `
        Analyze the following product trade-off scenario:
        Objective: ${objective}
        Constraints: ${selectedConstraints.join(', ')}
        Value Priority (Highest to Lowest): ${values.map(v => v.label).join(', ')}
        ${generatePrd ? 'Generate a concise Product Requirements Document (PRD) for this objective.' : ''}
        ${suggestUiUx ? 'Provide a recommendation for the best UI/UX approach based on this objective and constraints.' : ''}
        
        Provide a brutal, logical analysis of the trade-offs.
        ${generatePrd || suggestUiUx ? 'Include the requested PRD and UI/UX suggestions in your response.' : ''}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conflict_severity: { type: Type.INTEGER, description: "0-10 scale of how contradictory the constraints/values are" },
              logic_gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Flaws or impossibilities in the current setup" },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING, description: "Name of the strategic path" },
                    tradeoffs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What must be sacrificed" },
                    score: { type: Type.INTEGER, description: "Viability score 0-100" }
                  },
                  required: ["path", "tradeoffs", "score"]
                }
              },
              prd: { type: Type.STRING, description: "Generated PRD text in markdown. Present only if explicitly asked.", nullable: true },
              ui_ux_suggestion: { type: Type.STRING, description: "UI/UX suggestions in markdown. Present only if explicitly asked.", nullable: true }
            },
            required: ["conflict_severity", "logic_gaps", "recommendations"]
          }
        }
      });

      addToLog('ANALYSIS COMPLETE. PARSING QUANTUM STATE...');
      const result = JSON.parse(response.text || '{}') as AIResponse;
      setAiResult(result);
      addToLog(`CONFLICT SEVERITY: ${result.conflict_severity}/10`);
      
    } catch (error) {
      console.error(error);
      addToLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, z: -100 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      z: 0,
      transition: { 
        duration: 2.5, 
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // ease-out-expo
        staggerChildren: 0.2
      } 
    },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.5 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" as const } }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 z-10">
      
      {/* Header Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
        className="absolute top-8 left-8 flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
          <div className="w-4 h-4 bg-vanta" />
        </div>
        <h1 className="font-mono text-2xl font-bold tracking-tighter uppercase relative overflow-hidden">
          <span className="relative z-10">Gliss</span>
          <motion.div 
            className="absolute inset-0 bg-emerald z-20 mix-blend-screen"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
          />
        </h1>
      </motion.div>

      {/* Main Content Area */}
      <div className="w-full max-w-4xl relative">
        <AnimatePresence mode="wait">
          
          {/* STAGE 1: OBJECTIVE */}
          {stage === 'objective' && (
            <motion.div
              key="stage-objective"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center space-y-12"
            >
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-sm font-mono text-emerald tracking-[0.3em] uppercase">Phase 01 // Initialization</h2>
                <h3 className="text-5xl md:text-7xl font-medium tracking-tight text-glow">State Your Objective</h3>
              </motion.div>
              
              <motion.div variants={itemVariants} className="w-full max-w-2xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald to-cyan opacity-20 blur-xl group-hover:opacity-40 transition duration-1000"></div>
                <div className={`relative glass-panel p-2 flex items-center transition-colors ${showObjectiveError ? 'border-rose/50' : ''}`}>
                  <Terminal className={`w-6 h-6 ml-4 transition-colors ${showObjectiveError ? 'text-rose' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="e.g., Build a scalable MVP in 6 weeks..."
                    className="w-full bg-transparent border-none outline-none text-xl md:text-2xl p-4 font-sans text-white placeholder-gray-600 focus:ring-0 digital-flicker"
                    autoFocus
                  />
                  <div className={`w-3 h-8 animate-pulse mr-4 ${showObjectiveError ? 'bg-rose' : 'bg-emerald'}`} />
                </div>
                <AnimatePresence>
                  {showObjectiveError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -bottom-8 right-0 text-rose font-mono text-sm tracking-wider flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Description too brief. Requires {15 - objective.trim().length} more characters.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={() => isObjectiveValid && setStage('constraints')}
                disabled={!isObjectiveValid}
                className="group relative px-8 py-4 bg-white text-vanta font-mono font-bold uppercase tracking-widest overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Lock Objective <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-emerald transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 z-0" />
              </motion.button>
            </motion.div>
          )}

          {/* STAGE 2: CONSTRAINTS */}
          {stage === 'constraints' && (
            <motion.div
              key="stage-constraints"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center w-full space-y-12"
            >
              <motion.div variants={itemVariants} className="text-center space-y-4">
                <h2 className="text-sm font-mono text-emerald tracking-[0.3em] uppercase">Phase 02 // Parameters</h2>
                <h3 className="text-4xl md:text-5xl font-medium tracking-tight">Define Constraints</h3>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {constraints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => toggleConstraint(c.id)}
                    className={`glass-panel p-6 cursor-pointer transition-all duration-500 relative overflow-hidden group ${
                      c.selected ? 'border-emerald inner-glow-emerald' : 'hover:border-white/30'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-emerald/10 transform transition-transform duration-500 ${c.selected ? 'scale-100' : 'scale-0'}`} />
                    <span className={`relative z-10 font-mono text-sm tracking-wide transition-colors duration-300 ${c.selected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4">
                <button onClick={() => setStage('objective')} className="px-6 py-3 font-mono text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                  Back
                </button>
                <button
                  onClick={() => setStage('ranker')}
                  className="px-8 py-3 bg-white text-vanta font-mono font-bold uppercase tracking-widest hover:bg-emerald hover:text-white transition-colors"
                >
                  Confirm Parameters
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 3: VALUE RANKER */}
          {stage === 'ranker' && (
            <motion.div
              key="stage-ranker"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center w-full space-y-12"
            >
              <motion.div variants={itemVariants} className="text-center space-y-4">
                <h2 className="text-sm font-mono text-emerald tracking-[0.3em] uppercase">Phase 03 // Hierarchy</h2>
                <h3 className="text-4xl md:text-5xl font-medium tracking-tight">Rank Core Values</h3>
                <p className="text-gray-400 font-mono text-sm">Drag to establish priority (Top = Highest)</p>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full max-w-md">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={values} strategy={verticalListSortingStrategy}>
                    {values.map((val) => (
                      <SortableItem key={val.id} id={val.id} label={val.label} />
                    ))}
                  </SortableContext>
                </DndContext>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-4 w-full max-w-md my-4 items-start">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 flex flex-shrink-0 items-center justify-center border transition-colors ${generatePrd ? 'bg-emerald border-emerald' : 'bg-transparent border-white/30 group-hover:border-emerald'}`}>
                    {generatePrd && <div className="w-2.5 h-2.5 bg-vanta" />}
                  </div>
                  <span className={`font-mono text-sm uppercase tracking-widest ${generatePrd ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>Generate PRD</span>
                  <input type="checkbox" className="hidden" checked={generatePrd} onChange={() => setGeneratePrd(!generatePrd)} />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 flex flex-shrink-0 items-center justify-center border transition-colors ${suggestUiUx ? 'bg-emerald border-emerald' : 'bg-transparent border-white/30 group-hover:border-emerald'}`}>
                    {suggestUiUx && <div className="w-2.5 h-2.5 bg-vanta" />}
                  </div>
                  <span className={`font-mono text-sm uppercase tracking-widest ${suggestUiUx ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>Suggest Best UI/UX</span>
                  <input type="checkbox" className="hidden" checked={suggestUiUx} onChange={() => setSuggestUiUx(!suggestUiUx)} />
                </label>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4">
                <button onClick={() => setStage('constraints')} className="px-6 py-3 font-mono text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                  Back
                </button>
                <button
                  onClick={runAnalysis}
                  className="px-8 py-3 bg-emerald text-white font-mono font-bold uppercase tracking-widest hover:bg-cyan transition-colors relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Initialize Engine
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 4: DASHBOARD */}
          {stage === 'dashboard' && (
            <motion.div
              key="stage-dashboard"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col w-full space-y-8"
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-t-2 border-emerald rounded-full animate-spin" />
                    <div className="absolute inset-2 border-r-2 border-cyan rounded-full animate-spin-reverse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="font-mono text-emerald tracking-widest uppercase animate-pulse">Computing Trade-offs...</p>
                </div>
              ) : aiResult ? (
                <div className="space-y-8">
                  {/* Conflict Banner */}
                  {aiResult.conflict_severity > 6 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-rose/10 border border-rose/50 p-4 flex items-start gap-4 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-rose/5 animate-pulse" />
                      <AlertTriangle className="w-6 h-6 text-rose shrink-0 relative z-10" />
                      <div className="relative z-10">
                        <h4 className="font-mono font-bold text-rose uppercase tracking-wider mb-1">High Conflict Detected (Severity: {aiResult.conflict_severity}/10)</h4>
                        <p className="text-sm text-rose/80 font-mono">Your constraints and values are fundamentally opposed. Logic gaps identified.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Logic Gaps */}
                  {aiResult.logic_gaps.length > 0 && (
                    <div className="glass-panel p-6 space-y-4">
                      <h4 className="font-mono text-sm text-gray-400 uppercase tracking-widest">Identified Logic Gaps</h4>
                      <ul className="space-y-2">
                        {aiResult.logic_gaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-emerald font-mono">[{idx + 1}]</span>
                            <span className="text-gray-300">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-mono text-sm text-gray-400 uppercase tracking-widest">Strategic Paths</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="glass-panel p-6 group hover:border-emerald/50 transition-colors relative overflow-hidden">
                          {/* 3D Hover effect simulation via CSS */}
                          <div className="absolute top-0 right-0 p-4">
                            <span className="font-mono text-2xl font-bold text-white/20 group-hover:text-emerald/40 transition-colors">{rec.score}</span>
                          </div>
                          <h5 className="font-bold text-lg mb-4 text-white group-hover:text-glow transition-all">{rec.path}</h5>
                          <div className="space-y-2">
                            <span className="text-xs font-mono text-gray-500 uppercase">Required Trade-offs:</span>
                            <ul className="space-y-1">
                              {rec.tradeoffs.map((t, i) => (
                                <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-rose rounded-full" /> {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRD & UI/UX Outputs */}
                  {(aiResult.prd || aiResult.ui_ux_suggestion) && (
                    <div className="space-y-8 mt-8 w-full max-w-4xl mx-auto text-left">
                      {aiResult.prd && (
                        <div className="glass-panel p-8 space-y-6">
                          <h4 className="font-mono text-sm text-emerald uppercase tracking-widest border-b border-white/10 pb-4">Product Requirements Document (PRD)</h4>
                          <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-sans prose-headings:text-white prose-a:text-emerald max-w-none font-sans text-sm text-gray-300">
                             <Markdown>{aiResult.prd}</Markdown>
                          </div>
                        </div>
                      )}
                      
                      {aiResult.ui_ux_suggestion && (
                        <div className="glass-panel p-8 space-y-6">
                          <h4 className="font-mono text-sm text-cyan uppercase tracking-widest border-b border-white/10 pb-4">UI/UX Strategy & Recommendations</h4>
                          <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-sans prose-headings:text-white prose-a:text-cyan max-w-none font-sans text-sm text-gray-300">
                             <Markdown>{aiResult.ui_ux_suggestion}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-center pt-8">
                    <button onClick={() => setStage('objective')} className="px-8 py-3 border border-white/20 font-mono text-sm hover:bg-white hover:text-vanta transition-colors uppercase tracking-widest">
                      New Analysis
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audit Log Drawer Toggle */}
      <button 
        onClick={() => setIsAuditOpen(!isAuditOpen)}
        className="fixed bottom-8 right-8 w-12 h-12 glass-panel rounded-full flex items-center justify-center hover:border-emerald transition-colors z-50 group"
      >
        <Terminal className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      {/* Audit Log Drawer */}
      <AnimatePresence>
        {isAuditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-96 glass-panel border-l border-white/10 z-40 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-vanta/50">
              <h3 className="font-mono text-sm tracking-widest uppercase text-emerald">Audit Log</h3>
              <button onClick={() => setIsAuditOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono text-xs text-green-400/80 bg-vanta/80">
              {auditLog.map((log, i) => (
                <div key={i} className="break-words">{log}</div>
              ))}
              {isAnalyzing && (
                <div className="animate-pulse">_</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
