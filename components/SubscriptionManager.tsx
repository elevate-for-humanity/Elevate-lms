"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

interface Subscription {
  id: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  price: number;
}

export function SubscriptionManager() {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Load subscription from database
  React.useEffect(() => {
    const loadSubscription = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (data) {
        setCurrentSubscription({
          id: data.id,
          planName: data.plan_name || 'Pro Plan',
          status: data.status,
          currentPeriodEnd: new Date(data.current_period_end),
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
          price: data.price || 4999,
        });
      } else {
        // Default for demo
        setCurrentSubscription({
          id: 'sub_123',
          planName: 'Pro Plan',
          status: 'active',
          currentPeriodEnd: new Date('2024-04-15'),
          cancelAtPeriodEnd: false,
          price: 4999,
        });
      }
      setLoading(false);
    };
    loadSubscription();
  }, []);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 2999,
      interval: 'month',
      features: [
        'Access to all courses',
        'Course certificates',
        'Community forum access',
        'Email support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 4999,
      interval: 'month',
      popular: true,
      features: [
        'Everything in Basic',
        '1-on-1 mentoring sessions',
        'Priority support',
        'Career coaching',
        'Resume review',
        'Interview prep',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 9999,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Custom learning paths',
        'Dedicated account manager',
        'Team collaboration tools',
        'Advanced analytics',
        'API access',
      ],
    },
  ];

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      setCurrentSubscription({
        ...currentSubscription,
        cancelAtPeriodEnd: true,
      });
    }
  };

  const handleReactivateSubscription = () => {
    setCurrentSubscription({
      ...currentSubscription,
      cancelAtPeriodEnd: false,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800">Past Due</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Subscription</CardTitle>
            {getStatusBadge(currentSubscription.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{currentSubscription.planName}</div>
                <div className="text-black">
                  ${(currentSubscription.price / 100).toFixed(2)}/month
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-black mb-1">
                  <Calendar size={16} />
                  <span>Renews on</span>
                </div>
                <div className="font-semibold">
                  {currentSubscription.currentPeriodEnd.toLocaleDateString()}
                </div>
              </div>
            </div>

            {currentSubscription.cancelAtPeriodEnd && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-semibold text-orange-900 mb-1">
                    Subscription Ending
                  </div>
                  <div className="text-sm text-orange-800">
                    Your subscription will end on{' '}
                    {currentSubscription.currentPeriodEnd.toLocaleDateString()}. You&apos;ll
                    still have access until then.
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1">
                <CreditCard size={16} className="mr-2" />
                Update Payment Method
              </Button>
              {currentSubscription.cancelAtPeriodEnd ? (
                <Button
                  onClick={handleReactivateSubscription}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Reactivate Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="flex-1 text-brand-orange-600 border-red-600 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-2 border-red-600 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-brand-orange-600 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-2xl md:text-3xl lg:text-4xl">
                    ${(plan.price / 100).toFixed(0)}
                  </span>
                  <span className="text-black">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-brand-orange-600 hover:bg-brand-orange-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {currentSubscription.planName === plan.name
                    ? 'Current Plan'
                    : 'Upgrade to ' + plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2024-03-15', amount: 4999, status: 'paid' },
              { date: '2024-02-15', amount: 4999, status: 'paid' },
              { date: '2024-01-15', amount: 4999, status: 'paid' },
            ].map((invoice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      ${(invoice.amount / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-black">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Download Invoice
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
