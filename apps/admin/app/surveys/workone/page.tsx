'use client';

import { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, AlertTriangle, Phone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SurveyResponse {
  id: string;
  applicant_email: string;
  applicant_name: string;
  went_to_workone: boolean;
  signed_up_for_funding: boolean;
  still_needs_to_go: boolean;
  was_put_in_other_program: boolean;
  was_persuaded_away_from_elevate: boolean;
  feedback: string;
  wants_callback: boolean;
  best_phone: string;
  submitted_at: string;
  sent_at: string;
}

interface SummaryStats {
  totalResponses: number;
  wentToWorkone: number;
  signedUpForFunding: number;
  stillNeedsToGo: number;
  wasPutInOtherProgram: number;
  wasPersuadedAway: number;
  wantsCallback: number;
}

export default function WorkOneSurveyPage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'needsCallback' | 'persuadedAway'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadResponses();
  }, [filter, page]);

  async function loadResponses() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filter === 'needsCallback') params.set('needsCallback', 'true');
      if (filter === 'persuadedAway') params.set('persuadedAway', 'true');

      const res = await fetch(`/api/surveys/workone/responses?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setResponses(data.responses || []);
        setStats(data.summary);
      }
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendSurveys() {
    if (!confirm('Send the WorkOne survey to ALL eligible applicants? This will email everyone who has applied.')) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/surveys/workone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendToAll: true }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSendResult({
          success: true,
          message: `Survey sent to ${data.successful} applicants!`,
        });
        loadResponses();
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Failed to send surveys',
        });
      }
    } catch (err) {
      setSendResult({
        success: false,
        message: 'Failed to send surveys',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WorkOne Funding Survey</h1>
          <p className="text-gray-600 mt-1">
            Track applicant experiences with WorkOne workforce centers
          </p>
        </div>
        <button
          onClick={sendSurveys}
          disabled={sending}
          className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {sending ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Send Survey to All Applicants
            </>
          )}
        </button>
      </div>

      {/* Send Result */}
      {sendResult && (
        <div className={`mb-6 p-4 rounded-lg ${sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {sendResult.success ? <CheckCircle className="w-5 h-5 inline mr-2" /> : <XCircle className="w-5 h-5 inline mr-2" />}
          {sendResult.message}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalResponses}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Went to WorkOne</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.wentToWorkone}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalResponses > 0 ? Math.round((stats.wentToWorkone / stats.totalResponses) * 100) : 0}%
                </p>
              </div>
              <Users className="w-10 h-10 text-emerald-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Help / Still Needs</p>
                <p className="text-3xl font-bold text-amber-600">{stats.stillNeedsToGo}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalResponses > 0 ? Math.round((stats.stillNeedsToGo / stats.totalResponses) * 100) : 0}%
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wants Callback</p>
                <p className="text-3xl font-bold text-purple-600">{stats.wantsCallback}</p>
              </div>
              <Phone className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signed Up for Funding</p>
                <p className="text-3xl font-bold text-green-600">{stats.signedUpForFunding}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Put in Other Program</p>
                <p className="text-3xl font-bold text-red-600">{stats.wasPutInOtherProgram}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Persuaded Away from Elevate</p>
                <p className="text-3xl font-bold text-red-700">{stats.wasPersuadedAway}</p>
                <p className="text-xs text-gray-500">These need immediate follow-up</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-700 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Responses
        </button>
        <button
          onClick={() => { setFilter('needsCallback'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'needsCallback' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Needs Callback
        </button>
        <button
          onClick={() => { setFilter('persuadedAway'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'persuadedAway' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Persuaded Away (Urgent)
        </button>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Loading responses...</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-600">No responses yet</p>
            <p className="text-sm text-gray-500">Send the survey to start collecting feedback</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WorkOne</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{response.applicant_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{response.applicant_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {response.went_to_workone ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Went
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not yet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {response.signed_up_for_funding ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Signed up
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not yet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {response.still_needs_to_go ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Needs Help
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Complete
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {response.was_persuaded_away_from_elevate && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            ⚠ Persuaded Away
                          </span>
                        )}
                        {response.was_put_in_other_program && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Other Program
                          </span>
                        )}
                        {response.wants_callback && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            📞 Callback: {response.best_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString() : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {responses.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={responses.length < 20}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
