const questions = [
  '👋 Welcome to Elevate for Humanity! What can I help you with today?',
  'Are you looking for workforce training, AI/Data Science programs, or community resources?',
  'Would you like to explore our programs, join our community, or learn about our ecosystem?',
  'Great! Let me guide you to the right place...',
];

const responses = {
  training:
    '🎓 Perfect! Our workforce training programs include AI/Data Science bootcamps, WIOA programs, and professional certifications.',
  community:
    '🤝 Excellent! Our community hub connects you with peers, mentors, and ongoing support throughout your career journey.',
  ecosystem:
    '🌟 Wonderful! Our ecosystem includes Rise Forward Foundation, healthcare services, and comprehensive support networks.',
};

let step = 0;
let userPath = '';

function startAssistant() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = `<div class="message bot-message">${questions[step]}</div>`;
  showOptions();
}

function showOptions() {
  const chatBox = document.getElementById('chat-box');

  if (step === 0) {
    chatBox.innerHTML += `
      <div class="options">
        <button onclick="selectOption('training')" class="option-btn">🎓 Training Programs</button>
        <button onclick="selectOption('community')" class="option-btn">🤝 Community Hub</button>
        <button onclick="selectOption('ecosystem')" class="option-btn">🌟 Our Ecosystem</button>
      </div>
    `;
  } else if (step === 1) {
    chatBox.innerHTML += `
      <div class="options">
        <button onclick="selectOption('programs')" class="option-btn">📚 View Programs</button>
        <button onclick="selectOption('connect')" class="option-btn">🔗 Join Community</button>
        <button onclick="selectOption('sister-sites')" class="option-btn">🏢 Sister Sites</button>
      </div>
    `;
  }
}

function selectOption(choice) {
  const chatBox = document.getElementById('chat-box');
  userPath = choice;

  // Add user response
  let userText = '';
  switch (choice) {
    case 'training':
      userText = 'I want to learn about training programs';
      break;
    case 'community':
      userText = 'I want to join the community';
      break;
    case 'ecosystem':
      userText = 'Tell me about your ecosystem';
      break;
    case 'programs':
      userText = 'Show me the programs';
      break;
    case 'connect':
      userText = 'I want to connect';
      break;
    case 'sister-sites':
      userText = 'Show me sister sites';
      break;
  }

  chatBox.innerHTML += `<div class="message user-message">${userText}</div>`;

  // Progress conversation
  step++;
  if (step < questions.length - 1) {
    setTimeout(() => {
      chatBox.innerHTML += `<div class="message bot-message">${questions[step]}</div>`;
      showOptions();
    }, 1000);
  } else {
    // Final response and redirect
    setTimeout(() => {
      let finalResponse = '';
      let redirectUrl = '';

      switch (choice) {
        case 'programs':
          finalResponse = '🎓 Taking you to our comprehensive programs page...';
          redirectUrl = '/programs';
          break;
        case 'connect':
          finalResponse = '🤝 Connecting you to our community hub...';
          redirectUrl = '/connect';
          break;
        case 'sister-sites':
          finalResponse = '🏢 Showing you our complete ecosystem...';
          redirectUrl = '/sister-sites';
          break;
        default:
          finalResponse = '✨ Let me show you our main hub...';
          redirectUrl = '/hub';
      }

      chatBox.innerHTML += `<div class="message bot-message">${finalResponse}</div>`;

      setTimeout(() => {
        if (redirectUrl.startsWith('/')) {
          // Smooth scroll to section if it exists on current page
          const sectionId = redirectUrl.substring(1);
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          } else {
            // Navigate to page
            window.location.href = redirectUrl;
          }
        }
      }, 2000);
    }, 1000);
  }

  // Scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

function toggleAssistant() {
  const assistant = document.getElementById('assistant');
  assistant.classList.toggle('open');

  if (assistant.classList.contains('open') && step === 0) {
    setTimeout(startAssistant, 300);
  }
}

function resetChat() {
  step = 0;
  userPath = '';
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '';
  startAssistant();
}

// Auto-start after page load
document.addEventListener('DOMContentLoaded', function () {
  // Auto-open assistant after 3 seconds
  setTimeout(() => {
    const assistant = document.getElementById('assistant');
    if (!assistant.classList.contains('open')) {
      toggleAssistant();
    }
  }, 3000);
});
