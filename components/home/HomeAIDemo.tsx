'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, GraduationCap, Award, Code, Sparkles, Play, CheckCircle, ArrowRight } from 'lucide-react';

interface DemoStep {
  icon: typeof Bot;
  title: string;
  description: string;
  example?: string;
}

const demoSteps: DemoStep[] = [
  {
    icon: Bot,
    title: 'PARIS AI Assistant',
    description: 'Your intelligent workforce advisor available 24/7 to guide students through their career journey.',
    example: 'Try: "What funding am I eligible for?"',
  },
  {
    icon: GraduationCap,
    title: 'AI-Powered Learning',
    description: 'Personalized course recommendations and adaptive learning paths based on your goals and pace.',
    example: 'Try: "Create a learning plan for healthcare"',
  },
  {
    icon: Code,
    title: 'Dev Studio',
    description: 'AI-assisted development environment with code generation, debugging, and deployment tools.',
    example: 'Try: "Build a student enrollment form"',
  },
  {
    icon: Award,
    title: 'Credential Engine',
    description: 'Automatic credential verification, blockchain certification, and employer-ready portfolios.',
    example: 'Try: "Verify my certifications"',
  },
  {
    icon: Zap,
    title: 'Course Factory',
    description: 'AI generates curriculum, assessments, and learning materials in minutes, not months.',
    example: 'Try: "Generate a CNA training course"',
  },
];

export function HomeAIDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentStep = demoSteps[activeStep];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-500/20 rounded-full text-brand-red-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Live Demo
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            See AI in Action
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Experience how our AI-powered platform accelerates workforce development from enrollment to employment.
          </p>
        </motion.div>

        {/* Demo Interface */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar - Feature List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-3"
          >
            {demoSteps.map((step, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  activeStep === index
                    ? 'bg-brand-red-500/20 border-2 border-brand-red-500'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeStep === index ? 'bg-brand-red-500' : 'bg-white/10'
                  }`}>
                    <step.icon className={`w-5 h-5 ${activeStep === index ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${activeStep === index ? 'text-white' : 'text-slate-300'}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{step.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Main Demo Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              {/* Demo Header */}
              <div className="bg-slate-900/80 px-6 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-brand-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-400 font-medium">PARIS AI Demo</span>
                </div>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-red-500/20 hover:bg-brand-red-500/30 text-brand-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {isPlaying ? 'Stop' : 'Play Demo'}
                </button>
              </div>

              {/* Demo Content */}
              <div className="p-8">
                {/* AI Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={isPlaying ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    } : {}}
                    transition={{ repeat: isPlaying ? Infinity : 0, duration: 2 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                      isPlaying ? 'bg-brand-red-500' : 'bg-slate-700'
                    }`}
                  >
                    <currentStep.icon className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                {/* Feature Title */}
                <h3 className="text-2xl font-bold text-white text-center mb-4">
                  {currentStep.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-center mb-6">
                  {currentStep.description}
                </p>

                {/* Example */}
                {currentStep.example && (
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-slate-500 mb-2">Try asking:</p>
                    <p className="text-brand-red-400 font-medium italic">
                      "{currentStep.example.replace('Try: ', '')}"
                    </p>
                  </div>
                )}

                {/* Simulated Response */}
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Bot className="w-5 h-5 text-brand-red-400 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-700 rounded w-full animate-pulse" />
                        <div className="h-3 bg-slate-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Features Checklist */}
                <div className="mt-8 space-y-3">
                  <FeatureCheck text="Natural language processing" />
                  <FeatureCheck text="Real-time responses" />
                  <FeatureCheck text="Contextual learning" />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 text-center">
              <a
                  href="/paris/interview"
                className="inline-flex items-center gap-2 text-brand-red-400 hover:text-brand-red-300 font-semibold transition-colors"
              >
                Try the full AI assistant
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeatureCheck({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <CheckCircle className="w-5 h-5 text-green-400" />
      <span>{text}</span>
    </div>
  );
}

export default HomeAIDemo;
