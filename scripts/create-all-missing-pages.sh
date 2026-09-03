#!/usr/bin/env bash
# Create ALL Missing Pages

set -euo pipefail

echo "🚀 Creating ALL Missing Pages"
echo "=============================="
echo ""

# Create DurableLanding.jsx
echo "Creating DurableLanding.jsx..."
cat > src/pages/DurableLanding.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function DurableLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Build Durable Skills for the Future
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Master the essential skills that employers value most and build a lasting career
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/courses" className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition">
              Explore Programs
            </Link>
            <Link to="/get-started" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition">
              Get Started Free
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-2xl font-bold mb-4">Communication</h3>
            <p className="text-gray-600">Master professional communication, presentation, and interpersonal skills</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold mb-4">Critical Thinking</h3>
            <p className="text-gray-600">Develop problem-solving and analytical thinking abilities</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-2xl font-bold mb-4">Collaboration</h3>
            <p className="text-gray-600">Learn to work effectively in teams and lead projects</p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-xl shadow-lg">
          <h2 className="text-4xl font-bold mb-6 text-center">Why Durable Skills Matter</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">🎯 Career Resilience</h3>
              <p className="text-gray-600">Skills that remain valuable regardless of technological changes</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">📈 Higher Earning Potential</h3>
              <p className="text-gray-600">Professionals with strong durable skills earn 20% more on average</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">🌟 Leadership Opportunities</h3>
              <p className="text-gray-600">Essential for advancing into management and leadership roles</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">🔄 Adaptability</h3>
              <p className="text-gray-600">Easily transition between industries and roles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Create DurableAI.jsx
echo "Creating DurableAI.jsx..."
cat > src/pages/DurableAI.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function DurableAI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Learning Platform
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Personalized education powered by artificial intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold mb-4">AI Tutor</h3>
            <p className="text-gray-600 mb-4">Get instant help from our AI tutor, available 24/7 to answer questions and provide guidance</p>
            <Link to="/ai-tutor" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Try AI Tutor →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-4">Adaptive Learning</h3>
            <p className="text-gray-600 mb-4">AI adjusts content difficulty and pace based on your performance and learning style</p>
            <Link to="/courses" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Start Learning →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-4">Smart Analytics</h3>
            <p className="text-gray-600 mb-4">Track your progress with AI-powered insights and personalized recommendations</p>
            <Link to="/dashboard" className="text-indigo-600 font-semibold hover:text-indigo-700">
              View Dashboard →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-4">Content Generation</h3>
            <p className="text-gray-600 mb-4">AI creates custom practice problems and study materials tailored to your needs</p>
            <Link to="/lms" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Access LMS →
            </Link>
          </div>
        </div>

        <div className="bg-white p-12 rounded-xl shadow-lg text-center">
          <h2 className="text-4xl font-bold mb-6">Experience the Future of Learning</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are achieving their goals faster with AI-powered education
          </p>
          <Link to="/get-started" className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition inline-block">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
EOF

# Create DurableTemplates.jsx
echo "Creating DurableTemplates.jsx..."
cat > src/pages/DurableTemplates.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function DurableTemplates() {
  const templates = [
    { name: 'Career Development', icon: '💼', courses: 12 },
    { name: 'Technical Skills', icon: '💻', courses: 18 },
    { name: 'Leadership', icon: '👔', courses: 8 },
    { name: 'Communication', icon: '💬', courses: 10 },
    { name: 'Project Management', icon: '📊', courses: 15 },
    { name: 'Entrepreneurship', icon: '🚀', courses: 9 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Program Templates
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pre-built learning paths designed by industry experts
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-6xl mb-4">{template.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-4">{template.courses} courses included</p>
              <Link to="/courses" className="text-indigo-600 font-semibold hover:text-indigo-700">
                View Template →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

# Create DurableFeatures.jsx
echo "Creating DurableFeatures.jsx..."
cat > src/pages/DurableFeatures.jsx << 'EOF'
import React from 'react';

export default function DurableFeatures() {
  const features = [
    {
      title: 'Interactive Learning',
      description: 'Engage with hands-on exercises and real-world projects',
      icon: '🎮'
    },
    {
      title: 'Expert Instructors',
      description: 'Learn from industry professionals with years of experience',
      icon: '👨‍🏫'
    },
    {
      title: 'Flexible Schedule',
      description: 'Study at your own pace, anytime and anywhere',
      icon: '⏰'
    },
    {
      title: 'Certificates',
      description: 'Earn recognized certificates upon course completion',
      icon: '🎓'
    },
    {
      title: 'Community Support',
      description: 'Connect with peers and mentors in our learning community',
      icon: '👥'
    },
    {
      title: 'Career Services',
      description: 'Get job placement assistance and career guidance',
      icon: '💼'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Platform Features
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to succeed in your learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 border-2 border-gray-200 rounded-xl hover:border-indigo-500 transition">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

# Create DurablePricing.jsx
echo "Creating DurablePricing.jsx..."
cat > src/pages/DurablePricing.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function DurablePricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Access to free courses',
        'Community support',
        'Basic certificates',
        'Limited AI tutor access'
      ],
      cta: 'Get Started',
      link: '/get-started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      features: [
        'All free features',
        'Unlimited course access',
        'Premium certificates',
        'Unlimited AI tutor',
        'Career services',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      link: '/get-started',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      features: [
        'All Pro features',
        'Custom learning paths',
        'Dedicated account manager',
        'API access',
        'Advanced analytics',
        'White-label options'
      ],
      cta: 'Contact Sales',
      link: '/contact',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white p-8 rounded-xl shadow-lg ${plan.highlighted ? 'ring-4 ring-indigo-500 transform scale-105' : ''}`}
            >
              {plan.highlighted && (
                <div className="bg-indigo-500 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-600 ml-2">/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to={plan.link}
                className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${
                  plan.highlighted 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

# Create ProgramsDurable.jsx
echo "Creating ProgramsDurable.jsx..."
cat > src/pages/ProgramsDurable.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function ProgramsDurable() {
  const programs = [
    {
      title: 'Workforce Development',
      description: 'Comprehensive training for career advancement and job readiness',
      duration: '12 weeks',
      level: 'All Levels',
      students: '2,500+',
      image: '💼'
    },
    {
      title: 'Digital Skills Bootcamp',
      description: 'Master essential digital tools and technologies for the modern workplace',
      duration: '8 weeks',
      level: 'Beginner',
      students: '1,800+',
      image: '💻'
    },
    {
      title: 'Leadership Academy',
      description: 'Develop leadership skills and advance into management roles',
      duration: '10 weeks',
      level: 'Intermediate',
      students: '1,200+',
      image: '👔'
    },
    {
      title: 'Entrepreneurship Program',
      description: 'Learn to start and grow your own business',
      duration: '16 weeks',
      level: 'All Levels',
      students: '900+',
      image: '🚀'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Durable Skills Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive programs designed to build lasting career skills
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {programs.map((program, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-6xl mb-4">{program.image}</div>
              <h3 className="text-2xl font-bold mb-3">{program.title}</h3>
              <p className="text-gray-600 mb-6">{program.description}</p>
              <div className="flex gap-4 mb-6 text-sm text-gray-500">
                <span>⏱️ {program.duration}</span>
                <span>📊 {program.level}</span>
                <span>👥 {program.students}</span>
              </div>
              <Link 
                to="/courses"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                View Program
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

echo ""
echo "✅ All missing pages created!"
echo ""
echo "Created pages:"
echo "  - DurableLanding.jsx"
echo "  - DurableAI.jsx"
echo "  - DurableTemplates.jsx"
echo "  - DurableFeatures.jsx"
echo "  - DurablePricing.jsx"
echo "  - ProgramsDurable.jsx"
echo ""
echo "Run diagnostic again to verify:"
echo "  bash scripts/diagnostic-routing.sh"
