'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';

export function AIAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setShowWelcome(false);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome to Elevate for Humanity! How can I help you today?\n\n• Do you need guided navigation?\n• Want to explore on your own?\n• Talk to a human?'
        }
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    setTimeout(() => {
      let response = '';
      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes('guided') || lowerInput.includes('navigation') || lowerInput.includes('help')) {
        response = 'I can guide you through:\n\n• Applying for programs\n• Checking WIOA eligibility\n• Exploring training options\n• Finding funding sources\n\nWhat would you like to learn about?';
      } else if (lowerInput.includes('human') || lowerInput.includes('talk') || lowerInput.includes('person')) {
        response = 'I\'d be happy to connect you with our team!\n\n📞 Call: Contact Us\n📧 Email: info@www.elevateforhumanity.org\n\nOr click here to schedule a call: [Contact Us](/contact)';
      } else if (lowerInput.includes('explore') || lowerInput.includes('own')) {
        response = 'Great! Here are some quick links:\n\n• [View Programs](/programs)\n• [Check Eligibility](/wioa-eligibility)\n• [Apply Now](/apply)\n• [About Us](/about)\n\nFeel free to ask if you need anything!';
      } else if (lowerInput.includes('program') || lowerInput.includes('training')) {
        response = 'We offer training in:\n\n• Healthcare (CNA, Medical Assistant)\n• Skilled Trades (HVAC, Electrical)\n• Technology (IT, Cybersecurity)\n• Business (Accounting, Management)\n\n[View All Programs](/programs)';
      } else if (lowerInput.includes('wioa') || lowerInput.includes('eligible') || lowerInput.includes('funding')) {
        response = 'WIOA funding may cover your training costs!\n\nYou may qualify if you:\n• Are unemployed or underemployed\n• Have low income\n• Are a veteran\n• Receive public assistance\n\n[Check Your Eligibility](/wioa-eligibility)';
      } else if (lowerInput.includes('apply') || lowerInput.includes('enroll')) {
        response = 'Ready to get started?\n\n1. Choose your program\n2. Check eligibility\n3. Complete application\n4. Meet with advisor\n\n[Start Application](/apply)';
      } else {
        response = 'I can help you with:\n\n• Program information\n• WIOA eligibility\n• Application process\n• Talking to a human\n\nWhat would you like to know?';
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Welcome Tooltip */}
      {showWelcome && !isOpen && (
        <div className="fixed bottom-24 right-6 z-50 transition-all duration-300 ease-out opacity-100 translate-y-0">
          <div className="bg-white rounded-lg shadow-2xl p-4 max-w-xs border border-gray-200 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              aria-label="Close welcome message"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-black font-medium mb-2">
              Welcome to Elevate for Humanity!
            </p>
            <p className="text-xs text-black mb-3">
              Need help navigating? I'm here to assist you!
            </p>
            <button
              onClick={handleOpen}
              className="text-xs bg-brand-blue-600 text-white px-3 py-2.5 rounded-md hover:bg-brand-blue-700 transition-colors font-medium"
            >
              Chat with me
            </button>
          </div>
        </div>
      )}

      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex bg-brand-blue-600 text-white rounded-full p-4 shadow-2xl hover:bg-brand-blue-700 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-blue-300"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-10 w-10" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-96 h-[80vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col border border-gray-200 transition-all duration-300 ease-out opacity-100 translate-y-0">
          {/* Header */}
          <div className="bg-brand-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Elevate Assistant</h3>
                <p className="text-xs text-white/80">Here to help you navigate</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-white text-black shadow-sm border border-gray-200'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-brand-blue-100 rounded-full p-1">
                        <MessageCircle className="h-3 w-3 text-brand-blue-600" />
                      </div>
                      <span className="text-xs font-semibold text-black">Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-brand-blue-600 text-white rounded-full p-2 hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Need immediate help? Call{' '}
              <a href="/contact" className="text-brand-blue-600 hover:underline font-medium">
                Contact Us
              </a>
            </p>
          </div>
        </div>
      )}

    </>
  );
}
