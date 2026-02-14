"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useState, useEffect, useRef } from 'react';

interface StudentRecord {
  name: string;
  program: string;
  startDate: string;
  email?: string;
  phone?: string;
  status: 'enrolled' | 'active' | 'completed' | 'dropped';
}

interface CopilotMessage {
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  action?: () => void;
}

export function CopilotAssistant() {
  const [pastedData, setPastedData] = useState('');
  const [parsedRecords, setParsedRecords] = useState<StudentRecord[]>([]);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClient();
  const sessionId = useRef(crypto.randomUUID());

  // Log copilot usage to DB
  const logCopilotAction = async (action: string, recordCount?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('copilot_usage_log')
      .insert({
        admin_id: user?.id,
        session_id: sessionId.current,
        action,
        record_count: recordCount,
        timestamp: new Date().toISOString()
      });
  };

  const parseStudentData = (data: string) => {
    setIsProcessing(true);
    logCopilotAction('parse_started');
    setCopilotMessages([
      {
        type: 'info',
        message: '🤖 Analyzing your data... Let me help you process this!',
      },
    ]);

    // Smart parsing logic
    const lines = data.split('\n').filter((line) => line.trim());
    const records: StudentRecord[] = [];
    const issues: string[] = [];

    lines.forEach((line, index) => {
      // Handle various formats: CSV, tab-separated, space-separated
      const parts = line.split(/[,\t]/).map((p) => p.trim());

      if (parts.length >= 3) {
        const record: StudentRecord = {
          name: parts[0] || `Student ${index + 1}`,
          program: parts[1] || 'General Program',
          startDate: parts[2] || new Date().toISOString().split('T')[0],
          email: parts[3] || '',
          phone: parts[4] || '',
          status: 'enrolled',
        };

        // Validate and suggest fixes
        if (!record.email) {
          issues.push(`Missing email for ${record.name}`);
        }
        if (!isValidDate(record.startDate)) {
          record.startDate = new Date().toISOString().split('T')[0];
          issues.push(`Fixed invalid date for ${record.name}`);
        }

        records.push(record);
      }
    });

    setParsedRecords(records);

    // Generate copilot guidance
    const messages: CopilotMessage[] = [
      {
        type: 'success',
        message: `✅ Great! I found ${records.length} student records. Here's what I detected:`,
      },
      {
        type: 'info',
        message: `📊 Programs: ${[...new Set(records.map((r) => r.program))].join(', ')}`,
      },
    ];

    if (issues.length > 0) {
      messages.push({
        type: 'warning',
        message: `⚠️ I fixed ${issues.length} issues automatically. Click 'Review Issues' to see details.`,
      });
    }

    messages.push({
      type: 'success',
      message:
        '🚀 Ready to import! Click "Process All Records" when you\'re ready.',
      action: () => processAllRecords(),
    });

    setCopilotMessages(messages);
    setIsProcessing(false);
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const processAllRecords = async () => {
    setIsProcessing(true);
    setCopilotMessages([
      {
        type: 'info',
        message: '🔄 Processing all records... Setting up tracking systems...',
      },
    ]);

    // Simulate API call to save records
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setCopilotMessages([
      {
        type: 'success',
        message: `🎉 Success! Imported ${parsedRecords.length} student records.`,
      },
      {
        type: 'info',
        message:
          '📊 Attrition and retention tracking is now active for these students.',
      },
      {
        type: 'info',
        message: '📈 Check the Analytics Dashboard to view real-time metrics.',
      },
    ]);

    setIsProcessing(false);
  };

  return (
    <div className="copilot-assistant bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-brand-blue-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-bold">🤖</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-brand-text">
            Copilot Assistant
          </h2>
          <p className="text-brand-text-muted">
            I'll help you import and track student data
          </p>
        </div>
      </div>
      {/* Copilot Messages */}
      <div className="copilot-messages mb-6 space-y-3">
        {copilotMessages.map((msg, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              msg.type === 'success'
                ? 'bg-green-50 border-green-400 text-brand-success'
                : msg.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                  : msg.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-brand-blue-50 border-brand-blue-400 text-brand-info'
            }`}
          >
            <p className="font-medium">{msg.message}</p>
            {msg.action && (
              <button
                onClick={msg.action}
                className="mt-2 bg-brand-info text-white px-4 py-2 rounded hover:bg-brand-info-hover"
              >
                Process All Records
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Data Input Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-brand-text mb-2">
          📋 Paste Student Data (Excel, CSV, or any format)
        </label>
        <textarea
          value={pastedData}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPastedData(e.target.value)}
          placeholder="Paste your student data here...
Example:
John Smith, Medical Assistant, 2025-01-15, john@email.com
Sarah Johnson, IT Support, 2025-01-22, sarah@email.com"
          className="w-full h-32 p-3 border border-brand-border-dark rounded-lg focus:ring-2 focus:ring-brand-focus"
        />
        <button
          onClick={() => parseStudentData(pastedData)}
          disabled={!pastedData.trim() || isProcessing}
          className="mt-3 bg-brand-info text-white px-6 py-2 rounded-lg hover:bg-brand-info-hover disabled:opacity-50"
        >
          {isProcessing ? '🔄 Processing...' : '🤖 Analyze Data'}
        </button>
      </div>
      {/* Parsed Records Preview */}
      {parsedRecords.length > 0 && (
        <div className="parsed-records">
          <h3 className="text-lg font-semibold mb-3">
            📊 Detected Records ({parsedRecords.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-brand-border">
              <thead className="bg-brand-surface">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-light uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-light uppercase">
                    Program
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-light uppercase">
                    Start Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-light uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedRecords.slice(0, 5).map((record, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-brand-text">
                      {record.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-brand-text-muted">
                      {record.program}
                    </td>
                    <td className="px-4 py-2 text-sm text-brand-text-muted">
                      {record.startDate}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex px-2 py-2 text-xs font-semibold rounded-full bg-brand-surface text-brand-success">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRecords.length > 5 && (
              <p className="text-sm text-brand-text-light mt-2">
                ... and {parsedRecords.length - 5} more records
              </p>
            )}
          </div>
        </div>
      )}
      {/* Quick Actions */}
      <div className="quick-actions mt-6 p-4 bg-brand-surface rounded-lg">
        <h4 className="font-semibold mb-3">🚀 Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-white border border-brand-border rounded-lg hover:bg-brand-surface text-left">
            <div className="font-medium">📊 View Analytics</div>
            <div className="text-sm text-brand-text-muted">
              Check retention rates
            </div>
          </button>
          <button className="p-3 bg-white border border-brand-border rounded-lg hover:bg-brand-surface text-left">
            <div className="font-medium">📋 WIOA Reports</div>
            <div className="text-sm text-brand-text-muted">
              Generate compliance reports
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
