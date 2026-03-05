'use client';

import { useState } from 'react';
import InteractiveVideoPlayer, { Checkpoint } from '@/components/lms/InteractiveVideoPlayer';
import { PostVideoQuiz } from '@/components/lms/PostVideoQuiz';
import { CheckCircle, Lock } from 'lucide-react';

const VIDEO_CHECKPOINTS: Checkpoint[] = [
  {
    type: 'quiz',
    timestamp: 30,
    question: 'What does the compressor do in a refrigeration cycle?',
    options: [
      'Cools the air directly',
      'Compresses low-pressure gas into high-pressure gas',
      'Filters contaminants from refrigerant',
      'Regulates airflow through ductwork',
    ],
    answer: 1,
    explanation: 'The compressor takes low-pressure vapor from the evaporator and compresses it into high-pressure, high-temperature gas.',
  },
  {
    type: 'key-concept',
    timestamp: 60,
    concept: 'The Four Stages of Refrigeration',
    bullets: [
      'Compression — compressor pressurizes refrigerant gas',
      'Condensation — condenser rejects heat, gas becomes liquid',
      'Expansion — metering device drops pressure',
      'Evaporation — evaporator absorbs heat, liquid becomes gas',
    ],
  },
  {
    type: 'quiz',
    timestamp: 90,
    question: 'Which credential is required by federal law to handle refrigerants?',
    options: ['OSHA 30', 'EPA 608 Universal', 'NATE Core', 'State HVAC License'],
    answer: 1,
    explanation: 'The Clean Air Act Section 608 requires EPA 608 certification for anyone purchasing or handling refrigerants.',
  },
  {
    type: 'reflection',
    timestamp: 120,
    prompt: 'Why did you choose HVAC as a career? What does success look like for you in 2 years?',
    minChars: 50,
  },
  {
    type: 'scenario',
    timestamp: 150,
    situation: 'You arrive at a no-cool service call. The homeowner says the AC stopped working yesterday. What do you check first?',
    choices: [
      { text: 'Check refrigerant levels immediately', feedback: 'Jumping to refrigerant first wastes time. Start simple.', correct: false },
      { text: 'Check thermostat settings and power', feedback: 'Correct! Thermostat issues are the #1 cause of no-cool calls. Always start simple.', correct: true },
      { text: 'Replace the compressor', feedback: 'Never replace parts without diagnosing first. That\'s expensive guesswork.', correct: false },
      { text: 'Check the ductwork', feedback: 'Ductwork rarely causes a sudden no-cool. Start with thermostat and power.', correct: false },
    ],
  },
];

const QUIZ_QUESTIONS = [
  { question: 'What does the compressor do in a refrigeration cycle?', options: ['Cools the air directly', 'Compresses low-pressure gas into high-pressure gas', 'Filters contaminants from refrigerant', 'Regulates airflow through ductwork'], answer: 1, explanation: 'The compressor takes low-pressure vapor from the evaporator and compresses it into high-pressure, high-temperature gas that flows to the condenser.' },
  { question: 'What is superheat a measurement of?', options: ['Temperature above the boiling point of the refrigerant', 'Temperature of the air leaving the supply register', 'Pressure difference between suction and discharge', 'Ambient temperature minus return air temperature'], answer: 0, explanation: 'Superheat measures how many degrees the refrigerant vapor has been heated above its boiling point at the current pressure.' },
  { question: 'Normal suction pressure for R-410A residential cooling is approximately:', options: ['30-50 psig', '58-80 psig', '118-150 psig', '200-250 psig'], answer: 2, explanation: 'R-410A operates at higher pressures than R-22. Normal suction pressure is approximately 118-150 psig at typical cooling conditions.' },
  { question: 'What is the purpose of the metering device (TXV or piston)?', options: ['Compress refrigerant to high pressure', 'Remove moisture from the refrigerant', 'Reduce pressure and control flow into the evaporator', 'Measure airflow across the coil'], answer: 2, explanation: 'The metering device creates a pressure drop that converts high-pressure liquid into a low-pressure mix entering the evaporator.' },
  { question: 'A condenser fan motor reads 240V but draws 0 amps. Most likely fault?', options: ['Bad capacitor', 'Open motor winding (failed motor)', 'Tripped high-pressure switch', 'Low refrigerant charge'], answer: 1, explanation: 'Voltage present with zero amperage means the motor cannot draw current — indicating an open winding. The motor must be replaced.' },
  { question: 'What safety step before opening a condenser electrical panel?', options: ['Put on safety glasses', 'Pull disconnect and verify 0V with meter', 'Turn thermostat to OFF', 'Close the service valves'], answer: 1, explanation: 'Always pull the disconnect AND verify 0 volts with a multimeter. The thermostat does not de-energize the unit.' },
  { question: 'High discharge pressure with normal suction most likely indicates:', options: ['Low refrigerant charge', 'Restricted condenser airflow', 'Failed compressor valves', 'Oversized ductwork'], answer: 1, explanation: 'When the condenser cannot reject heat (dirty coil, failed fan), discharge pressure rises while suction stays normal.' },
  { question: 'Which credential is required by law to handle refrigerants?', options: ['OSHA 30', 'EPA 608 Universal', 'NATE Core', 'First Aid/CPR'], answer: 1, explanation: 'EPA 608 Universal certification is the federal requirement for purchasing and handling refrigerants.' },
  { question: 'What should you check first on a no-cool service call?', options: ['Refrigerant levels', 'Compressor voltage', 'Thermostat settings', 'Ductwork condition'], answer: 2, explanation: 'Start simple — thermostat settings are the #1 cause of no-cool calls. Rule out the simplest causes first.' },
  { question: 'Subcooling of 22°F (normal 8-14°F) most likely indicates:', options: ['Low refrigerant charge', 'Overcharged system', 'Restricted metering device', 'Dirty evaporator coil'], answer: 1, explanation: 'Very high subcooling means excess liquid refrigerant is stacking up in the condenser — the system has too much charge.' },
];

export default function VideoQuizPreview() {
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [activeSection, setActiveSection] = useState<'video' | 'quiz'>('video');

  const videoWatchGateMet = videoProgress >= 60;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">HVAC Lesson Preview — Video + Quiz</h1>
        <p className="text-sm text-slate-500 mt-1">Watch the video, then pass the quiz to complete this lesson.</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex">
          <button
            onClick={() => setActiveSection('video')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
              activeSection === 'video'
                ? 'border-brand-blue-600 text-brand-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {videoComplete ? <CheckCircle className="w-4 h-4 text-brand-green-600" /> : null}
            Video Lesson
          </button>
          <button
            onClick={() => videoWatchGateMet && setActiveSection('quiz')}
            disabled={!videoWatchGateMet}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
              !videoWatchGateMet
                ? 'border-transparent text-slate-300 cursor-not-allowed'
                : activeSection === 'quiz'
                  ? 'border-brand-blue-600 text-brand-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {quizPassed ? <CheckCircle className="w-4 h-4 text-brand-green-600" /> : !videoWatchGateMet ? <Lock className="w-4 h-4" /> : null}
            Quiz (80% to pass)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {activeSection === 'video' ? (
          <div>
            <InteractiveVideoPlayer
              videoUrl="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/hvac-01-01-v13.mp4"
              title="HVAC Technician — Module 1: Program Orientation"
              checkpoints={VIDEO_CHECKPOINTS}
              onProgress={(p) => setVideoProgress(p)}
              onComplete={() => {
                setVideoComplete(true);
                setActiveSection('quiz');
              }}
            />
            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-brand-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <span className="text-slate-500">{Math.round(videoProgress)}% watched</span>
              {videoWatchGateMet && !videoComplete && (
                <span className="text-brand-green-600 text-xs font-medium">Quiz unlocked</span>
              )}
            </div>
          </div>
        ) : (
          <PostVideoQuiz
            questions={QUIZ_QUESTIONS}
            passingScore={80}
            videoWatchGateMet={videoWatchGateMet}
            onComplete={(score, passed) => {
              if (passed) setQuizPassed(true);
            }}
            onUnlock={() => setQuizPassed(true)}
          />
        )}
      </div>
    </div>
  );
}
