import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Clock, Bell, Shield, FileText, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Incident Response | Elevate Security',
  description: 'Security incident response procedures, breach notification, and contact information for the Elevate Workforce Platform.',
  keywords: ['incident response', 'breach notification', 'security', 'data breach'],
};

const incidentLevels = [
  {
    level: 'Critical',
    color: 'bg-red-100 text-red-800',
    examples: ['Data breach affecting participant data', 'System-wide outage', 'Ransomware attack'],
    responseTime: '1 hour',
    notificationTime: '24 hours',
  },
  {
    level: 'High',
    color: 'bg-orange-100 text-orange-800',
    examples: ['Unauthorized access to admin systems', 'Partial data exposure', 'Service degradation'],
    responseTime: '4 hours',
    notificationTime: '48 hours',
  },
  {
    level: 'Medium',
    color: 'bg-yellow-100 text-yellow-800',
    examples: ['Single account compromise', 'Non-sensitive data affected', 'Phishing attempt'],
    responseTime: '24 hours',
    notificationTime: '72 hours',
  },
  {
    level: 'Low',
    color: 'bg-slate-100 text-slate-800',
    examples: ['Minor policy violation', 'Failed attack attempt', 'Security recommendation'],
    responseTime: '5 business days',
    notificationTime: 'Next quarterly review',
  },
];

const responseSteps = [
  {
    step: '1',
    title: 'Detection & Reporting',
    description: 'Incidents are reported via email to security@elevateforhumanity.org or through the 24/7 incident hotline.',
    duration: 'Immediate',
  },
  {
    step: '2',
    title: 'Initial Assessment',
    description: 'Security team assesses scope, severity, and affected systems within the response time SLA.',
    duration: '1-4 hours',
  },
  {
    step: '3',
    title: 'Containment',
    description: 'Affected systems are isolated, credentials are rotated, and further access is prevented.',
    duration: '1-24 hours',
  },
  {
    step: '4',
    title: 'Investigation',
    description: 'Root cause analysis is conducted, evidence is preserved, and impact is fully determined.',
    duration: '1-7 days',
  },
  {
    step: '5',
    title: 'Notification',
    description: 'Affected parties and regulators are notified according to the incident severity and legal requirements.',
    duration: 'Per SLA',
  },
  {
    step: '6',
    title: 'Remediation & Recovery',
    description: 'Systems are restored, patches are applied, and affected users are assisted.',
    duration: '1-30 days',
  },
];

export default function IncidentResponsePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/security" className="hover:text-white">Security</Link>
            <span>/</span>
            <span className="text-white">Incident Response</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">Incident Response Plan</h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                Our procedures for identifying, responding to, and recovering from security incidents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-8 bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-900">24/7 Security Hotline:</span>
              <a href="tel:+13173143757" className="text-red-700 font-semibold">(317) 314-3757</a>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-900">Email:</span>
              <a href="mailto:security@elevateforhumanity.org" className="text-red-700 font-semibold">
                security@elevateforhumanity.org
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Levels */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Incident Severity Levels</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {incidentLevels.map((incident) => (
              <div key={incident.level} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${incident.color}`}>
                    {incident.level}
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Response: {incident.responseTime}</div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Examples:</h3>
                <ul className="space-y-1 mb-4">
                  {incident.examples.map((ex) => (
                    <li key={ex} className="text-sm text-slate-600">• {ex}</li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Customer notification:</span>
                    <span className="font-semibold text-slate-900">{incident.notificationTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Response Process */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Response Process</h2>
          <div className="space-y-6">
            {responseSteps.map((step, index) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.step}
                  </div>
                  {index < responseSteps.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-300 my-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                      <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breach Notification */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Breach Notification</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Notification Contents</h3>
                <ul className="space-y-3 text-slate-600">
                  <li>• Description of the incident in clear terms</li>
                  <li>• Types of data affected</li>
                  <li>• Number of individuals impacted</li>
                  <li>• Steps taken to investigate</li>
                  <li>• Remediation measures</li>
                  <li>• Recommended actions for affected parties</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4">Notification Methods</h3>
                <ul className="space-y-3 text-slate-600">
                  <li>• Direct email to affected addresses</li>
                  <li>• Dashboard notification</li>
                  <li>• Website posting</li>
                  <li>• Regulatory filings as required</li>
                  <li>• Press release if >100,000 affected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Report a Security Incident</h2>
          <p className="text-slate-300 mb-6">
            If you believe you have discovered a security vulnerability or incident, please contact us immediately.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="tel:+13173143757" className="bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-slate-100">
              Call: (317) 314-3757
            </a>
            <a href="mailto:security@elevateforhumanity.org" className="bg-slate-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600">
              Email: security@elevateforhumanity.org
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
