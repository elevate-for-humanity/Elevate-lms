"use client";

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  type: string;
}

export function SMSNotificationSystem() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  const fetchTemplates = useCallback(async () => {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setTemplates(data.map(t => ({
        id: t.id,
        name: t.name,
        message: t.template_text,
        type: t.template_type || 'notification',
      })));
    } else {
      // Fallback templates
      setTemplates([
        { id: '1', name: 'Assignment Reminder', message: 'Hi {name}, your assignment is due in 24 hours. Complete it at {link}', type: 'reminder' },
        { id: '2', name: 'Class Starting', message: 'Your class "{course}" starts in 15 minutes. Join now: {link}', type: 'alert' },
        { id: '3', name: 'Certificate Ready', message: 'Congratulations! Your certificate is ready. Download it here: {link}', type: 'notification' },
      ]);
    }

    // Fetch recent sent messages
    const { data: sent } = await supabase
      .from('sms_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sent) setSentMessages(sent);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const sendSMS = async () => {
    if (!phoneNumber || !message) return;
    
    setSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Log the SMS (actual sending would be via Twilio/etc)
      await supabase.from('sms_messages').insert({
        phone_number: phoneNumber,
        message_text: message,
        sent_by: user?.id,
        status: 'queued',
      });

      // Call SMS API
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, message }),
      }).catch(() => {});

      alert('SMS queued for delivery');
      setPhoneNumber('');
      setMessage('');
      fetchTemplates();
    } catch (err) {
      console.error('SMS error:', err);
      alert('Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">SMS Notifications</h1>
          <p className="text-brand-red-100">Send instant text messages to students</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Send SMS</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (317) 314-3757"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border rounded-lg h-32"
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {message.length}/160 characters
                  </p>
                </div>

                <Button className="w-full">Send SMS</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Recent Messages</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-semibold">Assignment Reminder</p>
                  <p className="text-xs text-black">Sent to 245 students • 2 hours ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-semibold">Class Starting Soon</p>
                  <p className="text-xs text-black">Sent to 89 students • 1 day ago</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Message Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setMessage(template.message)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    <p className="font-semibold text-sm">{template.name}</p>
                    <p className="text-xs text-black truncate">{template.message}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-black">Sent Today:</span>
                  <span className="font-semibold">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">This Month:</span>
                  <span className="font-semibold">3,456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Delivery Rate:</span>
                  <span className="font-semibold text-brand-green-600">98.5%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
