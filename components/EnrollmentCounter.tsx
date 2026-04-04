"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Users, TrendingUp, Clock, Zap, ArrowRight } from 'lucide-react';

interface EnrollmentData {
  total: number;
  thisMonth: number;
  today: number;
  activeStudents: number;
  lastUpdated: Date;
}

export default function EnrollmentCounter() {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    total: 0,
    thisMonth: 0,
    today: 0,
    activeStudents: 0,
    lastUpdated: new Date()
  });

  const [isLive, setIsLive] = useState(false);

  const totalCount = useMotionValue(0);
  const monthCount = useMotionValue(0);
  const todayCount = useMotionValue(0);
  const activeCount = useMotionValue(0);

  useEffect(() => {
    fetch('/api/admin/enrollment-stats')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setEnrollmentData({ ...d.data, lastUpdated: new Date() });
          setIsLive(true);
          animate(totalCount, d.data.total, { duration: 1.5 });
          animate(monthCount, d.data.thisMonth, { duration: 1.5 });
          animate(todayCount, d.data.today, { duration: 1.5 });
          animate(activeCount, d.data.activeStudents, { duration: 1.5 });
        }
      })
      .catch(() => {});

  }, [totalCount, monthCount, todayCount, activeCount]);

  // Format number with commas
  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('en-US');
  };

  // Time since last update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('just now');

  useEffect(() => {
    const updateTimer = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - enrollmentData.lastUpdated.getTime()) / 1000);

      if (seconds < 10) {
        setTimeSinceUpdate('just now');
      } else if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceUpdate(`${minutes}m ago`);
      }
    }, 1000);

    return () => clearInterval(updateTimer);
  }, [enrollmentData.lastUpdated]);

  return (
    <section className="py-16     relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <div className="relative">
              <Zap className="w-4 h-4" />
              {isLive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-brand-green-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            Live Enrollment Data
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Enroll Today
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Real people, real-time. Watch as students enroll and start their journey to a better career.
          </p>
        </motion.div>

        {/* Main Counter Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Enrollments */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-white/80" />
              <div className="text-xs text-white/60 font-semibold">ALL TIME</div>
            </div>
            <motion.div className="text-5xl font-bold text-white mb-2 text-3xl md:text-4xl lg:text-5xl">
              {formatNumber(totalCount.get())}
            </motion.div>
            <div className="text-white/80 font-semibold">Total Enrollments</div>
            <div className="mt-4 flex items-center gap-2 text-brand-green-300 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Growing daily</span>
            </div>
          </motion.div>

          {/* This Month */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-white/80" />
              <div className="text-xs text-white/60 font-semibold">THIS MONTH</div>
            </div>
            <motion.div className="text-5xl font-bold text-white mb-2 text-3xl md:text-4xl lg:text-5xl">
              {formatNumber(monthCount.get())}
            </motion.div>
            <div className="text-white/80 font-semibold">New Students</div>
            <div className="mt-4 flex items-center gap-2 text-brand-blue-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>December 2024</span>
            </div>
          </motion.div>

          {/* Today */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group relative overflow-hidden"
          >
            {isLive && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-1   "
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-white/80" />
              <div className="text-xs text-white/60 font-semibold">TODAY</div>
            </div>
            <motion.div className="text-5xl font-bold text-white mb-2 text-3xl md:text-4xl lg:text-5xl">
              {formatNumber(todayCount.get())}
            </motion.div>
            <div className="text-white/80 font-semibold">Enrolled Today</div>
            <div className="mt-4 flex items-center gap-2 text-brand-green-300 text-sm">
              <div className="w-2 h-2 bg-brand-green-400 rounded-full animate-pulse" />
              <span>Updated {timeSinceUpdate}</span>
            </div>
          </motion.div>

          {/* Active Students */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-white/80" />
              <div className="text-xs text-white/60 font-semibold">ACTIVE NOW</div>
            </div>
            <motion.div className="text-5xl font-bold text-white mb-2 text-3xl md:text-4xl lg:text-5xl">
              {formatNumber(activeCount.get())}
            </motion.div>
            <div className="text-white/80 font-semibold">Current Students</div>
            <div className="mt-4 flex items-center gap-2 text-purple-300 text-sm">
              <Users className="w-4 h-4" />
              <span>Learning right now</span>
            </div>
          </motion.div>
        </div>

        {/* Recent Enrollments Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-green-400 rounded-full animate-pulse" />
              Recent Enrollments
            </h3>
            <span className="text-sm text-white/60">Live updates</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Sarah M.', program: 'Healthcare Assistant', time: '2 minutes ago', location: 'Indianapolis, IN' },
              { name: 'James T.', program: 'HVAC Technician', time: '5 minutes ago', location: 'Fort Wayne, IN' },
              { name: 'Maria R.', program: 'Medical Coding', time: '8 minutes ago', location: 'Bloomington, IN' },
              { name: 'David K.', program: 'CDL Training', time: '12 minutes ago', location: 'Evansville, IN' },
              { name: 'Jennifer L.', program: 'Cosmetology', time: '15 minutes ago', location: 'South Bend, IN' }
            ].map((enrollment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10    rounded-full flex items-center justify-center text-white font-bold">
                    {enrollment.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{enrollment.name}</div>
                    <div className="text-white/60 text-sm">{enrollment.program}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-sm">{enrollment.location}</div>
                  <div className="text-white/50 text-xs">{enrollment.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl text-white/90 mb-6">
            Don't wait—join the next cohort starting soon!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg text-lg group"
            >
              Enroll Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/programs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all backdrop-blur-sm text-lg"
            >
              View Programs
              <Users className="w-5 h-5" />
            </a>
          </div>

          <p className="mt-6 text-white/60 text-sm">
            • No application fee  • Financial aid available  • Start in weeks, not months
          </p>
        </motion.div>
      </div>
    </section>
  );
}
