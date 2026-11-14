/**
 * UNIFIED NAVIGATION SYSTEM
 * Integrated header/footer for all sister sites with dropdown navigation
 */

class UnifiedNavigation {
  constructor() {
    this.sisterSites = {
      elevate_for_humanity: {
        name: 'Elevate for Humanity',
        url: '/',
        description: 'Workforce Development & Training',
        pages: [
          { name: 'Home', url: '/' },
          { name: 'Programs', url: '/programs/' },
          { name: 'Partner Marketplace', url: '/partner-marketplace.html' },
          { name: 'Student Portal', url: '/student-portal.html' },
          { name: 'Student Outcomes', url: '/student-outcomes.html' },
          { name: 'Funding Options', url: '/funding-options.html' },
          { name: 'Contact', url: '/contact/' },
        ],
      },
      rise_forward: {
        name: 'Rise Forward',
        url: '/rise-forward.html',
        description: 'Community Nonprofit Organization',
        pages: [
          { name: 'About', url: '/rise-forward.html' },
          { name: 'Community Programs', url: '/rise-forward.html#programs' },
          { name: 'Volunteer', url: '/rise-forward.html#volunteer' },
          { name: 'Donate', url: '/donate.html' },
          { name: 'Impact Stories', url: '/rise-forward.html#impact' },
        ],
      },
      kingdom_konnect: {
        name: 'Kingdom Konnect',
        url: '/kingdom-konnect.html',
        description: 'Faith-Based Community Development',
        pages: [
          { name: 'Ministry', url: '/kingdom-konnect.html' },
          { name: 'Faith Programs', url: '/kingdom-konnect.html#programs' },
          { name: 'Community Outreach', url: '/kingdom-konnect.html#outreach' },
          { name: 'Prayer Requests', url: '/kingdom-konnect.html#prayer' },
          { name: 'Events', url: '/kingdom-konnect.html#events' },
        ],
      },
      serene_comfort_care: {
        name: 'Serene Comfort Care',
        url: '/serene-comfort-care.html',
        description: 'Healthcare & CNA Training',
        pages: [
          { name: 'Services', url: '/serene-comfort-care.html' },
          { name: 'CNA Training', url: '/serene-comfort-care.html#training' },
          { name: 'Healthcare Jobs', url: '/serene-comfort-care.html#jobs' },
          { name: 'Patient Care', url: '/serene-comfort-care.html#care' },
          { name: 'Careers', url: '/serene-comfort-care.html#careers' },
        ],
      },
      urban_build_crew: {
        name: 'Urban Build Crew',
        url: '/urban-build-crew.html',
        description: 'Construction & Trades Training',
        pages: [
          { name: 'Construction', url: '/urban-build-crew.html' },
          { name: 'Trade Programs', url: '/urban-build-crew.html#trades' },
          { name: 'Apprenticeships', url: '/apprenticeships.html' },
          { name: 'Job Placement', url: '/urban-build-crew.html#jobs' },
          { name: 'Safety Training', url: '/urban-build-crew.html#safety' },
        ],
      },
    };

    this.currentSite = this.detectCurrentSite();
    this.initializeNavigation();
  }

  detectCurrentSite() {
    const path = window.location.pathname;
    if (path.includes('rise-forward')) return 'rise_forward';
    if (path.includes('kingdom-konnect')) return 'kingdom_konnect';
    if (path.includes('serene-comfort-care')) return 'serene_comfort_care';
    if (path.includes('urban-build-crew')) return 'urban_build_crew';
    return 'elevate_for_humanity';
  }

  initializeNavigation() {
    // Temporarily disabled - user doesn't like "All Sites" approach
    return;

    this.injectNavigationCSS();
    this.createUnifiedHeader();
    this.createUnifiedFooter();
    this.initializeBrainIntegration();
  }

  injectNavigationCSS() {
    const css = `
            /* UNIFIED NAVIGATION STYLES */
            .unified-nav {
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
            }

            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 70px;
            }

            .nav-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                color: white;
                text-decoration: none;
                font-weight: 700;
                font-size: 1.1rem;
            }

            .nav-brand .brand-icon {
                font-size: 1.5rem;
            }

            .nav-links {
                display: flex;
                align-items: center;
                gap: 24px;
            }

            .nav-link {
                color: white;
                text-decoration: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .nav-link:hover {
                background: rgba(255,255,255,0.1);
            }



            .brain-integration {
                background: none;
                border: 2px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 500;
                transition: all 0.2s ease;
                margin-left: 16px;
            }

            .brain-integration:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.5);
            }

            .unified-footer {
                background: #1e293b;
                color: white;
                padding: 40px 0 20px;
                margin-top: 60px;
            }

            .footer-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
            }

            .footer-section h4 {
                color: #22c55e;
                margin-bottom: 16px;
                font-size: 1.1rem;
            }

            .footer-links {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .footer-links a {
                color: #cbd5e1;
                text-decoration: none;
                font-size: 0.9rem;
                transition: color 0.2s ease;
            }

            .footer-links a:hover {
                color: #22c55e;
            }

            .footer-bottom {
                border-top: 1px solid #374151;
                margin-top: 30px;
                padding-top: 20px;
                text-align: center;
                color: #9ca3af;
                font-size: 0.85rem;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .nav-container {
                    padding: 0 15px;
                    height: 60px;
                }

                .nav-brand {
                    font-size: 1rem;
                }

                .nav-links {
                    gap: 16px;
                }

                .nav-link {
                    font-size: 0.9rem;
                    padding: 6px 10px;
                }

                .footer-content {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
            }

            /* Ensure body has top margin for fixed nav */
            body {
                margin-top: 70px !important;
            }

            @media (max-width: 768px) {
                body {
                    margin-top: 60px !important;
                }
            }
        `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  createUnifiedHeader() {
    const header = document.createElement('nav');
    header.className = 'unified-nav';

    const currentSiteData = this.sisterSites[this.currentSite];

    header.innerHTML = `
            <div class="nav-container">
                <a href="${currentSiteData.url}" class="nav-brand">
                    <span class="brand-icon">🌟</span>
                    <span class="brand-text">${currentSiteData.name}</span>
                </a>

                <div class="nav-links">
                    <a href="/" class="nav-link">Home</a>
                    <a href="/programs/" class="nav-link">Programs</a>
                    <a href="/funding-options.html" class="nav-link">Funding</a>
                    <a href="/contact/" class="nav-link">Contact</a>

                    <button class="brain-integration" onclick="window.unifiedNav.openBrainChat()">
                        🧠 AI Assistant
                    </button>
                </div>
            </div>
        `;

    // Insert at the very beginning of body
    document.body.insertBefore(header, document.body.firstChild);
  }

  createUnifiedFooter() {
    const footer = document.createElement('footer');
    footer.className = 'unified-footer';

    footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h4>🌟 Rise Foundation Ecosystem</h4>
                    <div class="footer-links">
                        <a href="/">Elevate for Humanity</a>
                        <a href="/rise-forward.html">Rise Forward</a>
                        <a href="/kingdom-konnect.html">Kingdom Konnect</a>
                        <a href="/serene-comfort-care.html">Serene Comfort Care</a>
                        <a href="/urban-build-crew.html">Urban Build Crew</a>
                    </div>
                </div>

                <div class="footer-section">
                    <h4>🎓 Training Programs</h4>
                    <div class="footer-links">
                        <a href="/programs/">All Programs</a>
                        <a href="/partner-marketplace.html">Partner Marketplace</a>
                        <a href="/apprenticeships.html">Apprenticeships</a>
                        <a href="/funding-options.html">Funding Options</a>
                        <a href="/student-outcomes.html">Student Outcomes</a>
                    </div>
                </div>

                <div class="footer-section">
                    <h4>🤝 Community</h4>
                    <div class="footer-links">
                        <a href="/student-portal.html">Student Portal</a>
                        <a href="/contact/">Contact Us</a>
                        <a href="/donate.html">Donate</a>
                        <a href="/volunteer.html">Volunteer</a>
                        <a href="/sister-sites.html">All Sister Sites</a>
                    </div>
                </div>

                <div class="footer-section">
                    <h4>🧠 AI Integration</h4>
                    <div class="footer-links">
                        <a href="#" onclick="window.unifiedNav.openBrainChat()">AI Assistant</a>
                        <a href="/ai-tutoring.html">AI Tutoring</a>
                        <a href="/career-guidance.html">Career Guidance</a>
                        <a href="/skills-assessment.html">Skills Assessment</a>
                    </div>
                </div>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2024 Selfish Inc. DBA Rise Foundation Ecosystem. All rights reserved.</p>
                <p>Unified navigation system connecting all sister sites with integrated AI assistance.</p>
            </div>
        `;

    document.body.appendChild(footer);
  }

  initializeBrainIntegration() {
    // Create brain chat interface
    const brainChat = document.createElement('div');
    brainChat.id = 'brain-chat-interface';
    brainChat.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            display: none;
            flex-direction: column;
            z-index: 10000;
        `;

    brainChat.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #4c1d95, #22c55e);
                color: white;
                padding: 16px;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: 600;">🧠 AI Assistant</div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">Connected across all sites</div>
                </div>
                <button onclick="window.unifiedNav.closeBrainChat()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                ">×</button>
            </div>

            <div style="
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
            " id="brain-chat-messages">
                <div style="
                    background: #f1f5f9;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                ">
                    👋 Hi! I'm your AI assistant, connected across all Rise Foundation sites. I can help with:
                    <br><br>
                    • Program information and enrollment
                    • Career guidance and planning
                    • Course recommendations
                    • Site navigation
                    • General questions
                    <br><br>
                    What would you like to know?
                </div>
            </div>

            <div style="
                padding: 16px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 8px;
            ">
                <input type="text" id="brain-chat-input" placeholder="Ask me anything..." style="
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.9rem;
                " onkeypress="if(event.key==='Enter') window.unifiedNav.sendBrainMessage()">
                <button onclick="window.unifiedNav.sendBrainMessage()" style="
                    background: #4c1d95;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Send</button>
            </div>
        `;

    document.body.appendChild(brainChat);
  }

  openBrainChat() {
    const chatInterface = document.getElementById('brain-chat-interface');
    chatInterface.style.display = 'flex';
    document.getElementById('brain-chat-input').focus();
  }

  closeBrainChat() {
    const chatInterface = document.getElementById('brain-chat-interface');
    chatInterface.style.display = 'none';
  }

  sendBrainMessage() {
    const input = document.getElementById('brain-chat-input');
    const messages = document.getElementById('brain-chat-messages');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = `
            background: #4c1d95;
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9rem;
            align-self: flex-end;
            max-width: 80%;
        `;
    userMsg.textContent = message;
    messages.appendChild(userMsg);

    // Clear input
    input.value = '';

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = this.generateAIResponse(message);
      const aiMsg = document.createElement('div');
      aiMsg.style.cssText = `
                background: #f1f5f9;
                padding: 10px;
                border-radius: 8px;
                font-size: 0.9rem;
                max-width: 80%;
            `;
      aiMsg.innerHTML = aiResponse;
      messages.appendChild(aiMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 1000);

    messages.scrollTop = messages.scrollHeight;
  }

  generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('program') || lowerMessage.includes('course')) {
      return `🎓 We offer programs across all our sites:<br><br>
                • <strong>Elevate for Humanity:</strong> Tech, healthcare, trades<br>
                • <strong>Serene Comfort Care:</strong> CNA and healthcare training<br>
                • <strong>Urban Build Crew:</strong> Construction and trades<br>
                • <strong>Kingdom Konnect:</strong> Faith-based development<br><br>
                <a href="/partner-marketplace.html" style="color: #4c1d95;">View all programs →</a>`;
    }

    if (lowerMessage.includes('site') || lowerMessage.includes('navigate')) {
      return `🌐 Our ecosystem includes:<br><br>
                • <strong>Elevate for Humanity:</strong> Main workforce development<br>
                • <strong>Rise Forward:</strong> Community nonprofit<br>
                • <strong>Kingdom Konnect:</strong> Faith-based programs<br>
                • <strong>Serene Comfort Care:</strong> Healthcare services<br>
                • <strong>Urban Build Crew:</strong> Construction training<br><br>
                Use the "All Sites" dropdown to navigate between them!`;
    }

    if (lowerMessage.includes('enroll') || lowerMessage.includes('apply')) {
      return `📝 Ready to enroll? Here's how:<br><br>
                1. Browse programs on any of our sites<br>
                2. Check funding options (many are free!)<br>
                3. Complete the application<br>
                4. Get matched with employers<br><br>
                <a href="/student-portal.html" style="color: #4c1d95;">Start your application →</a>`;
    }

    return `🤖 I'm here to help! I can assist with information about our programs, sites, enrollment process, and more. Try asking about:
            <br><br>• "What programs do you offer?"<br>• "How do I navigate between sites?"<br>• "How do I enroll?"<br>• "What funding is available?"`;
  }
}

// Initialize unified navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.unifiedNav = new UnifiedNavigation();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedNavigation;
}
