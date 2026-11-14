/* Autopilot core: queue + content index + lightweight classifier + persistence */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), '.data', 'autopilot.json');

function loadState() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      counters: parsed.counters || {},
      content: Array.isArray(parsed.content) ? parsed.content : [],
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch (_e) {
    return {
      tasks: [],
      counters: {},
      content: seedContent(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  state.updatedAt = Date.now();
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function seedContent() {
  return [
    {
      id: 'routes',
      title: 'Service Routes Map',
      tags: ['introspection', 'docs'],
      body: '/api/metrics, /api/readiness, /api/autopilot/*, /api/ask, /api/catalog, /api/marketing/*',
    },
    {
      id: 'pricing',
      title: 'Pricing & Plans',
      tags: ['pricing'],
      body: 'Starter, Growth, Impact; scholarships via WIOA/WRG/VR',
    },
    {
      id: 'workforce',
      title: 'Workforce Programs',
      tags: ['wioa', 'wrg', 'dOL', 'vr'],
      body: 'WIOA, WRG, DOL apprenticeship, Indiana VR vendor',
    },
  ];
}

const state = loadState();

const counters = {
  inc(name, by = 1) {
    state.counters[name] = (state.counters[name] || 0) + by;
    saveState(state);
    return state.counters[name];
  },
  getAll() {
    return { ...state.counters };
  },
};

const tasks = {
  enqueue(payload) {
    const id = 't_' + Math.random().toString(36).slice(2);
    const task = {
      id,
      status: 'queued',
      payload,
      createdAt: Date.now(),
      reason: payload.reason || 'unspecified',
    };
    state.tasks.push(task);
    counters.inc('autopilot_enqueued', 1);
    saveState(state);
    return task;
  },
  list() {
    return [...state.tasks];
  },
  get(id) {
    return state.tasks.find((t) => t.id === id);
  },
  remove(id) {
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      state.tasks.splice(idx, 1);
      saveState(state);
      return true;
    }
    return false;
  },
  stats() {
    const total = state.tasks.length;
    const byStatus = state.tasks.reduce((m, t) => ((m[t.status] = (m[t.status] || 0) + 1), m), {});
    return { total, byStatus };
  },
};

const content = {
  list() {
    return [...state.content];
  },
  search(q) {
    const qq = (q || '').toLowerCase();
    if (!qq) return [];
    return state.content.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(qq)) ||
        (c.body && c.body.toLowerCase().includes(qq)) ||
        (c.tags || []).some((tag) => (tag || '').toLowerCase().includes(qq)),
    );
  },
};

// Very simple topic classifier for /api/ask (fast & deterministic)
function classify(question) {
  const q = (question || '').toLowerCase();
  if (!q.trim()) return 'unknown';
  if (q.includes('price') || q.includes('plan') || q.includes('cost')) return 'pricing';
  if (q.includes('route') || q.includes('endpoint') || q.includes('api') || q.includes('docs'))
    return 'introspection';
  if (q.includes('metric') || q.includes('kpi')) return 'metrics';
  if (q.includes('autopilot') || q.includes('task') || q.includes('queue')) return 'autopilot';
  if (
    q.includes('workforce') ||
    q.includes('wioa') ||
    q.includes('wrg') ||
    q.includes('dol') ||
    q.includes('vr')
  )
    return 'workforce';
  return 'unknown';
}

module.exports = {
  state,
  counters,
  tasks,
  content,
  classify,
};
