'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Send, Loader2, Briefcase, GraduationCap, TrendingUp, 
  Target, ChevronRight, Sparkles, User, Bot
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserProfile {
  skills: string[];
  level: string;
  goal: string;
  interests: string[];
}

export default function AICareerCounseling() {
  const [step, setStep] = useState<'intro' | 'profile' | 'chat'>('intro');
  const [profile, setProfile] = useState<UserProfile>({
    skills: [],
    level: '',
    goal: '',
    interests: [],
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const skillOptions = [
    'Communication', 'Problem Solving', 'Technical Skills', 'Customer Service',
    'Physical Labor', 'Attention to Detail', 'Leadership', 'Computer Skills',
    'Math/Numbers', 'Creativity', 'Teamwork', 'Time Management'
  ];

  const interestOptions = [
    'Healthcare', 'Technology', 'Construction', 'Transportation',
    'Beauty/Cosmetology', 'Business', 'Manufacturing', 'Education'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const startChat = async () => {
    setStep('chat');
    setIsLoading(true);

    try {
      const response = await fetch('/api/career-counseling/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I'm looking for career guidance. My skills include: ${profile.skills.join(', ')}. My experience level is: ${profile.level}. My career goal is: ${profile.goal}. I'm interested in: ${profile.interests.join(', ')}.`,
          userProfile: profile,
        }),
      });

      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages([{ role: 'assistant', content: data.message }]);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setMessages([{ 
        role: 'assistant', 
        content: "Welcome! I'm your AI Career Counselor. Based on your profile, I'd love to help you explore career paths. What specific questions do you have about your career journey?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/career-counseling/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          userProfile: profile,
        }),
      });

      const data = await response.json();
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm here to help with your career planning. Could you rephrase your question?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Intro Screen
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI Career Counseling
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get personalized career guidance powered by AI. Discover career paths that match your skills, interests, and goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Target className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Personalized Guidance</h3>
              <p className="text-gray-600 text-sm">Get career recommendations tailored to your unique skills and interests.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <TrendingUp className="w-10 h-10 text-brand-green-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Salary Insights</h3>
              <p className="text-gray-600 text-sm">Learn about earning potential and job market trends in your field.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <GraduationCap className="w-10 h-10 text-brand-orange-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Training Paths</h3>
              <p className="text-gray-600 text-sm">Discover FREE training programs to help you reach your career goals.</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('profile')}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105"
            >
              Start Career Assessment
              <ChevronRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-4">Free • No account required • Takes 2 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // Profile Setup Screen
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 to-indigo-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about yourself</h2>
            
            <div className="space-y-8">
              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What are your strongest skills? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        profile.skills.includes(skill)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your experience level?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['No experience', 'Some experience', '1-3 years', '3+ years'].map(level => (
                    <button
                      key={level}
                      onClick={() => setProfile(prev => ({ ...prev, level }))}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        profile.level === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Goal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your primary career goal?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Start a new career',
                    'Get a promotion',
                    'Increase my salary',
                    'Learn new skills',
                    'Change industries',
                    'Start my own business'
                  ].map(goal => (
                    <button
                      key={goal}
                      onClick={() => setProfile(prev => ({ ...prev, goal }))}
                      className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
                        profile.goal === goal
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What industries interest you?
                </label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        profile.interests.includes(interest)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('intro')}
                className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={startChat}
                disabled={profile.skills.length === 0 || !profile.level || !profile.goal}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get My Career Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-full p-2">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">AI Career Counselor</h1>
              <p className="text-xs text-gray-500">Personalized guidance for your career journey</p>
            </div>
          </div>
          <Link href="/programs" className="text-sm text-indigo-600 hover:underline">
            View All Programs
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="bg-indigo-100 rounded-full p-2 h-fit">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white shadow-sm border'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="bg-gray-200 rounded-full p-2 h-fit">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="bg-indigo-100 rounded-full p-2 h-fit">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="border-t bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => sendMessage(suggestion)}
                className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-100 whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about careers, salaries, training programs..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
