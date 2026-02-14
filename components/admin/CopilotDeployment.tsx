"use client";

import React, { useState, useEffect } from 'react';

interface CopilotFeature {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  lastUpdated: string;
  usage: number;
  effectiveness: number;
}

interface StepByStepGuide {
  id: string;
  title: string;
  steps: GuideStep[];
  category: 'data_entry' | 'reporting' | 'analytics' | 'compliance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  action: string;
  tips: string[];
  warnings?: string[];
  screenshot?: string;
  videoUrl?: string;
}

export function CopilotDeployment() {
  const [copilotFeatures, setCopilotFeatures] = useState<CopilotFeature[]>([]);
  const [stepByStepGuides, setStepByStepGuides] = useState<StepByStepGuide[]>(
    []
  );
  const [deploymentStatus, setDeploymentStatus] = useState<
    'ready' | 'deploying' | 'deployed' | 'error'
  >('ready');
  const [selectedGuide, setSelectedGuide] = useState<StepByStepGuide | null>(
    null
  );

  useEffect(() => {
    loadCopilotFeatures();
    loadStepByStepGuides();
  }, []);

  const loadCopilotFeatures = () => {
    const features: CopilotFeature[] = [
      {
        id: 'data_processor',
        name: 'Intelligent Data Processor',
        description:
          'AI-powered copy/paste data processing with smart format detection',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 94,
        effectiveness: 97,
      },
      {
        id: 'barrier_analyzer',
        name: 'Learning Barrier Analyzer',
        description:
          'Automatic identification and remediation of learning challenges',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 87,
        effectiveness: 92,
      },
      {
        id: 'attrition_tracker',
        name: 'Attrition & Retention Tracker',
        description:
          'Real-time monitoring with predictive analytics and interventions',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 91,
        effectiveness: 89,
      },
      {
        id: 'program_generator',
        name: 'Auto Program Generator',
        description:
          'AI-powered creation and nationwide deployment of training programs',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 76,
        effectiveness: 95,
      },
      {
        id: 'excel_generator',
        name: 'Excel Chart Generator',
        description:
          'Automatic pie chart and report generation for Excel export',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 88,
        effectiveness: 96,
      },
      {
        id: 'wioa_compliance',
        name: 'WIOA Compliance Dashboard',
        description: 'Real-time compliance monitoring and automated reporting',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        usage: 92,
        effectiveness: 98,
      },
    ];

    setCopilotFeatures(features);
  };

  const loadStepByStepGuides = () => {
    const guides: StepByStepGuide[] = [
      {
        id: 'data_entry_guide',
        title: 'Copy & Paste Student Data Entry',
        category: 'data_entry',
        difficulty: 'beginner',
        estimatedTime: '5-10 minutes',
        steps: [
          {
            stepNumber: 1,
            title: 'Prepare Your Data',
            description:
              'Copy student data from Excel, Google Sheets, or any source',
            action: 'Copy your student data (Ctrl+C or Cmd+C)',
            tips: [
              'Any format works - CSV, tab-separated, or even messy text',
              'Include student names, programs, start dates, and contact info',
              "Don't worry about perfect formatting - AI will fix it",
            ],
          },
          {
            stepNumber: 2,
            title: 'Open the Data Processor',
            description:
              'Navigate to the Intelligent Data Processor in your admin dashboard',
            action: 'Click "🤖 Intelligent Data Processor" in the sidebar',
            tips: [
              'Look for the robot icon in your admin menu',
              'The processor is always available 24/7',
            ],
          },
          {
            stepNumber: 3,
            title: 'Paste Your Data',
            description: 'Paste your copied data into the large text area',
            action: 'Paste data in the text box (Ctrl+V or Cmd+V)',
            tips: [
              'The AI will immediately start analyzing your data format',
              "You'll see real-time feedback about what was detected",
            ],
          },
          {
            stepNumber: 4,
            title: 'Let AI Analyze',
            description:
              'Click "🤖 Process & Create Everything" to start AI analysis',
            action: 'Click the blue "Process & Create Everything" button',
            tips: [
              'AI will detect format, fix errors, and generate missing info',
              'Watch the copilot messages for real-time updates',
              'This usually takes 30-60 seconds',
            ],
          },
          {
            stepNumber: 5,
            title: 'Review Results',
            description:
              'Check the processed data and au analytics',
            action: 'Review the parsed student records and generated charts',
            tips: [
              'AI automatically creates flow charts and analytics',
              'Missing emails are auto-generated',
              'Invalid dates are automatically corrected',
            ],
          },
          {
            stepNumber: 6,
            title: 'Activate Tracking',
            description:
              'Confirm to activate automatic attrition and retention tracking',
            action: 'Click "Activate Tracking" to start monitoring',
            tips: [
              'Real-time tracking starts immediately',
              'At-risk students are identified automatically',
              'Intervention recommendations are generated',
            ],
          },
        ],
      },
      {
        id: 'excel_export_guide',
        title: 'Generate Excel Charts & Reports',
        category: 'reporting',
        difficulty: 'beginner',
        estimatedTime: '3-5 minutes',
        steps: [
          {
            stepNumber: 1,
            title: 'Access Chart Generator',
            description: 'Open the Excel Chart Generator from your dashboard',
            action: 'Click "📊 Excel Chart Generator" in the admin menu',
            tips: [
              'All your data is automatically available for charting',
              'Charts update in real-time as data changes',
            ],
          },
          {
            stepNumber: 2,
            title: 'Select Charts',
            description: 'Choose which pie charts and data to include',
            action: 'Check/uncheck charts you want in your Excel file',
            tips: [
              'All charts are selected by default',
              'Preview shows exactly how charts will look in Excel',
              'Include raw data tables for detailed analysis',
            ],
          },
          {
            stepNumber: 3,
            title: 'Configure Export',
            description: 'Set file name, chart size, and formatting options',
            action: 'Customize export settings in the options panel',
            tips: [
              'Use descriptive file names like "Q3_2024_WIOA_Report"',
              'Medium chart size works best for presentations',
              'Professional formatting is recommended for official reports',
            ],
          },
          {
            stepNumber: 4,
            title: 'Generate Excel File',
            description:
              'Click to automatically generate professional Excel workbook',
            action: 'Click "📊 Generate Excel with Charts"',
            tips: [
              'AI creates multiple worksheets with charts and data',
              'Professional formatting is applied automatically',
              'File downloads automatically when ready',
            ],
          },
        ],
      },
      {
        id: 'program_creation_guide',
        title: 'Au Training Programs',
        category: 'analytics',
        difficulty: 'intermediate',
        estimatedTime: '10-15 minutes',
        steps: [
          {
            stepNumber: 1,
            title: 'Access Program Generator',
            description:
              'Open the Auto Program Generator for AI-powered curriculum creation',
            action: 'Navigate to "🤖 Auto Program Generator"',
            tips: [
              'AI analyzes current job market demand',
              'Programs are created based on employer needs',
              'All programs include hands-on labs and certifications',
            ],
          },
          {
            stepNumber: 2,
            title: 'Generate New Program',
            description:
              'Let AI create a complete training program automatically',
            action: 'Click "🤖 Generate New Program"',
            tips: [
              'AI considers industry trends and salary data',
              'Complete curriculum is generated including assessments',
              'Programs are optimized for job placement success',
            ],
          },
          {
            stepNumber: 3,
            title: 'Review Program Details',
            description:
              'Examine the AI-generated curriculum, labs, and outcomes',
            action: 'Click "📊 View Details" on the generated program',
            tips: [
              'All modules include learning objectives and assessments',
              'Virtual labs are created for safe practice',
              'Industry certifications are automatically included',
            ],
          },
          {
            stepNumber: 4,
            title: 'Deploy Nationally',
            description:
              'Scale the program across multiple states and institutions',
            action: 'Click "🚀 Deploy Nationally" to expand availability',
            tips: [
              'AI identifies optimal partner institutions',
              'Federal funding sources are automatically matched',
              'Capacity planning is handled automatically',
            ],
          },
        ],
      },
    ];

    setStepByStepGuides(guides);
  };

  const deployAllFeatures = async () => {
    setDeploymentStatus('deploying');

    // Simulate deployment process
    for (let i = 0; i < copilotFeatures.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCopilotFeatures((prev) =>
        prev.map((feature, index) =>
          index === i ? { ...feature, status: 'active' } : feature
        )
      );
    }

    setDeploymentStatus('deployed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-brand-success bg-brand-surface';
      case 'deploying':
        return 'text-brand-info bg-brand-surface';
      case 'inactive':
        return 'text-brand-text-muted bg-brand-surface-dark';
      case 'error':
        return 'text-brand-orange-600 bg-brand-surface';
      default:
        return 'text-brand-text-muted bg-brand-surface-dark';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-brand-success bg-brand-surface';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'advanced':
        return 'text-brand-orange-600 bg-brand-surface';
      default:
        return 'text-brand-text-muted bg-brand-surface-dark';
    }
  };

  return (
    <div className="copilot-deployment">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-text">
            🚀 Copilot Deployment Center
          </h2>
          <p className="text-brand-text-muted">
            Deploy and manage AI-powered assistance for your staff
          </p>
        </div>
        <button
          onClick={deployAllFeatures}
          disabled={deploymentStatus === 'deploying'}
          className="bg-brand-info text-white px-6 py-3 rounded-lg hover:bg-brand-info-hover disabled:opacity-50 font-medium"
        >
          {deploymentStatus === 'deploying'
            ? '🔄 Deploying...'
            : '🚀 Deploy All Features'}
        </button>
      </div>
      {/* Deployment Status */}
      {deploymentStatus === 'deploying' && (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue-600 mr-4" />
            <div>
              <h3 className="font-semibold text-brand-blue-900">
                🤖 Deploying Copilot Features...
              </h3>
              <div className="text-sm text-brand-info mt-1">
                Setting up AI assistance for your staff members
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Copilot Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-brand-text mb-4">
          🤖 Active Copilot Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {copilotFeatures.map((feature) => (
            <div key={feature.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-brand-text">
                  {feature.name}
                </h4>
                <span
                  className={`px-2 py-2 text-xs font-medium rounded-full ${getStatusColor(feature.status)}`}
                >
                  {feature.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-brand-text-muted mb-4">
                {feature.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Usage Rate:</span>
                  <span className="font-medium">{feature.usage}%</span>
                </div>
                <div className="w-full bg-brand-border rounded-full h-2">
                  <div
                    className="bg-brand-blue-500 h-2 rounded-full"
                    style={{ width: `${feature.usage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Effectiveness:</span>
                  <span className="font-medium text-brand-success">
                    {feature.effectiveness}%
                  </span>
                </div>
                <div className="w-full bg-brand-border rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${feature.effectiveness}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Step-by-Step Guides */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-brand-text mb-4">
          📚 Step-by-Step Guides for Staff
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepByStepGuides.map((guide) => (
            <div key={guide.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-brand-text">{guide.title}</h4>
                <span
                  className={`px-2 py-2 text-xs font-medium rounded-full ${getDifficultyColor(guide.difficulty)}`}
                >
                  {guide.difficulty.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2 text-sm text-brand-text-muted mb-4">
                <div>📂 Category: {guide.category.replace('_', ' ')}</div>
                <div>⏱️ Time: {guide.estimatedTime}</div>
                <div>📋 Steps: {guide.steps.length}</div>
              </div>
              <button
                onClick={() => setSelectedGuide(guide)}
                className="w-full bg-brand-surface text-brand-info py-2 rounded hover:bg-brand-blue-200 font-medium"
              >
                📖 View Guide
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Guide Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedGuide.title}</h3>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-brand-text-light hover:text-brand-text"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              {selectedGuide.steps.map((step, index) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-brand-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {step.stepNumber}
                    </div>
                    <h4 className="font-semibold text-brand-text">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-brand-text mb-2">{step.description}</p>
                  <div className="bg-brand-blue-50 border border-brand-blue-200 rounded p-3 mb-3">
                    <div className="font-medium text-brand-blue-900 mb-1">
                      🎯 Action:
                    </div>
                    <div className="text-brand-info">{step.action}</div>
                  </div>
                  {step.tips.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="font-medium text-green-900 mb-1">
                        💡 Tips:
                      </div>
                      <ul className="text-brand-success text-sm space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Success Message */}
      {deploymentStatus === 'deployed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            🎉 Copilot Successfully Deployed!
          </h3>
          <p className="text-brand-success mb-4">
            All AI-powered features are now active and ready to assist your
            staff with:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <div className="font-medium">✅ Data Entry & Processing</div>
              <div>Smart copy/paste with automatic formatting</div>
            </div>
            <div>
              <div className="font-medium">✅ Learning Analytics</div>
              <div>Automatic barrier detection and remediation</div>
            </div>
            <div>
              <div className="font-medium">✅ Attrition Tracking</div>
              <div>Real-time monitoring and interventions</div>
            </div>
            <div>
              <div className="font-medium">✅ Program Generation</div>
              <div>AI-powered curriculum creation and deployment</div>
            </div>
            <div>
              <div className="font-medium">✅ Excel Reporting</div>
              <div>Automatic chart generation and export</div>
            </div>
            <div>
              <div className="font-medium">✅ WIOA Compliance</div>
              <div>Automated reporting and monitoring</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
