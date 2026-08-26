import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shield, Server, Database, RefreshCw, Clock, CheckCircle,
  AlertTriangle, Download, Cloud, HardDrive, Activity, Users,
  Phone, Mail, ArrowRight, Lock, Monitor
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disaster Recovery & Business Continuity',
  keywords: ["disaster recovery", "business continuity", "backup", "data protection", "uptime", "SLA"],
  description: 'Learn about our disaster recovery and business continuity plans. Backup schedules, recovery procedures, and uptime guarantees.',
};

export default function DisasterRecoveryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/team/instructors/instructor-recovery.webp" alt="Disaster recovery and business continuity - Elevate for Humanity" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Enterprise-Grade Reliability
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Disaster Recovery & Continuity
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              "If the system goes down, what happens?" — We have the answer. 
              Our infrastructure is built for resilience with multiple layers of protection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/security" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Security Overview
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                System Status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">99.9%</div>
              <p className="text-slate-600">Uptime SLA</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">1hr</div>
              <p className="text-slate-600">RPO (Recovery Point Objective)</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">4hr</div>
              <p className="text-slate-600">RTO (Recovery Time Objective)</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">30day</div>
              <p className="text-slate-600">Backup Retention</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens If */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Happens If the System Goes Down?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We understand that your organization depends on Elevate being available. 
              Here's exactly what happens in various scenarios.
            </p>
          </div>

          <div className="space-y-6">
            {/* Scenario 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Scenario: Major Service Outage
                  </h3>
                  <p className="text-slate-600 mb-4">
                    If our primary services experience a significant outage:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-brand-blue-600" />
                        Immediate Response (0-15 min)
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Automated monitoring alerts trigger
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          On-call engineer notified immediately
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Status page updated with incident notice
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Backup systems begin failover process
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-brand-blue-600" />
                        Recovery Process (15 min - 4 hr)
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Traffic automatically rerouted to backup
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Data integrity verified
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Services restored from hot standby
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Customers notified of resolution
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <HardDrive className="w-8 h-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Scenario: Data Center Failure
                  </h3>
                  <p className="text-slate-600 mb-4">
                    If our primary data center becomes unavailable:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-brand-blue-600" />
                        Geographic Redundancy
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Secondary data center in different region
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Real-time data replication
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Automatic failover without manual intervention
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          No data loss (1-hour RPO)
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-brand-blue-600" />
                        Data Protection
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          All data encrypted at rest and in transit
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          30-day backup retention
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Point-in-time recovery available
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Verified backup integrity checks
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Scenario: Security Incident
                  </h3>
                  <p className="text-slate-600 mb-4">
                    If a security breach or cyber attack occurs:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-brand-blue-600" />
                        Containment Steps
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Affected systems isolated immediately
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Threat vector identified and blocked
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Clean backups verified and secured
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Systems restored to known-good state
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-blue-600" />
                        Communication
                      </h4>
                      <ul className="space-y-2 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Affected customers notified within 72 hrs
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Full incident report provided
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Regulatory bodies informed as required
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          Remediation steps documented
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backup Infrastructure */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Backup Infrastructure
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Multiple layers of protection ensure your data is never lost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Backups</h3>
              <p className="text-slate-600 text-sm">
                Automated daily full backups at 2:00 AM EST
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Continuous Replication</h3>
              <p className="text-slate-600 text-sm">
                Real-time data sync to secondary location
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HardDrive className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">30-Day Retention</h3>
              <p className="text-slate-600 text-sm">
                Point-in-time recovery for last 30 days
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Encrypted Storage</h3>
              <p className="text-slate-600 text-sm">
                All backups encrypted with AES-256
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring & Escalation */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                24/7 Monitoring & Escalation
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Our infrastructure is monitored around the clock. When issues occur, 
                our team follows a proven escalation path to minimize impact.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Automated Monitoring</h4>
                    <p className="text-slate-600 text-sm">
                      Systems check health every 30 seconds. Anomalies trigger immediate alerts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">On-Call Response</h4>
                    <p className="text-slate-600 text-sm">
                      Senior engineers on-call 24/7. Critical issues acknowledged within 5 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Escalation Path</h4>
                    <p className="text-slate-600 text-sm">
                      L1 → L2 → L3 → Engineering Lead → CTO. Each level has defined response times.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Customer Communication</h4>
                    <p className="text-slate-600 text-sm">
                      Status page updated in real-time. Email notifications for major incidents.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Monitor className="w-6 h-6 text-brand-blue-600" />
                Support Escalation Contacts
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">Critical Outage</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Immediate</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      24/7 Hotline
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      emergency@elevateforhumanity.org
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">Urgent Issue</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">15 min</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Priority Support Line
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      support@elevateforhumanity.org
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">Standard Support</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Business Hours</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      help@elevateforhumanity.org
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLA Details */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Service Level Agreement
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our commitment to uptime and performance, backed by service credits.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-bold text-slate-900">Plan</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">Uptime SLA</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">RTO</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">RPO</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">Support</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 font-medium text-slate-900">Single User</td>
                  <td className="text-center py-4 px-4 text-slate-600">99.5%</td>
                  <td className="text-center py-4 px-4 text-slate-600">8 hours</td>
                  <td className="text-center py-4 px-4 text-slate-600">4 hours</td>
                  <td className="text-center py-4 px-4 text-slate-600">Email</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 font-medium text-slate-900">Small Business</td>
                  <td className="text-center py-4 px-4 text-slate-600">99.9%</td>
                  <td className="text-center py-4 px-4 text-slate-600">4 hours</td>
                  <td className="text-center py-4 px-4 text-slate-600">1 hour</td>
                  <td className="text-center py-4 px-4 text-slate-600">Priority Email + Chat</td>
                </tr>
                <tr className="bg-brand-blue-50">
                  <td className="py-4 px-4 font-bold text-brand-blue-600">Enterprise</td>
                  <td className="text-center py-4 px-4 font-bold text-brand-blue-600">99.99%</td>
                  <td className="text-center py-4 px-4 font-bold text-brand-blue-600">1 hour</td>
                  <td className="text-center py-4 px-4 font-bold text-brand-blue-600">15 min</td>
                  <td className="text-center py-4 px-4 font-bold text-brand-blue-600">24/7 Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Service Credits:</strong> If we fail to meet our SLA, Enterprise customers receive 
                service credits on a sliding scale (1 hour of free service per 1 hour of downtime below 99.9%).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Questions About Our Infrastructure?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our team is happy to provide detailed technical documentation, runbook summaries, 
            or answer any questions about our disaster recovery capabilities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Sales <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              View System Status
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}