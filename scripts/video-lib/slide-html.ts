/**
 * Animated HTML slide templates for institutional-quality training videos.
 * 1920x1080 with large readable text, timed bullet reveals, and
 * new slide types: objective (learning objectives) and quiz (knowledge check).
 */

const W = 1920;
const H = 1080;

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function base(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${W}px; height: ${H}px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; overflow: hidden; }
    .bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .dim { position: absolute; inset: 0; }
    .hdr { position: absolute; top: 0; left: 0; right: 0; height: 56px; background: rgba(0,0,0,0.5); display: flex; align-items: center; padding: 0 48px; z-index: 10; backdrop-filter: blur(6px);
      opacity: 0; animation: fadeIn 0.3s ease 0.1s forwards; }
    .hdr span { color: white; font-size: 18px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .hdr .a { color: #34d399; }
    .ftr { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; z-index: 10;
      background: linear-gradient(90deg, #f59e0b, #10b981, #3b82f6);
      transform: scaleX(0); transform-origin: left; animation: barGrow 0.5s ease 0.2s forwards; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideLeft { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 70% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
  `;
}

function hdr(): string {
  return `<div class="hdr"><span>Elevate for Humanity <span class="a">|</span> HVAC Technician Training</span></div>`;
}

// ─── TITLE SLIDE ────────────────────────────────────────────────

export function titleSlideHTML(title: string, subtitle: string, bg64: string): string {
  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: rgba(0,0,0,0.35); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 120px; z-index: 5; }
    .badge { background: #10b981; color: white; padding: 12px 32px; border-radius: 28px; font-size: 20px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;
      opacity: 0; animation: popIn 0.5s ease 0.3s forwards; }
    h1 { color: white; font-size: 76px; font-weight: 900; text-align: center; line-height: 1.1; 
      opacity: 0; animation: slideUp 0.6s ease 0.7s forwards; }
    .bar { width: 120px; height: 6px; background: #f59e0b; border-radius: 3px; margin: 32px 0;
      transform: scaleX(0); animation: barGrow 0.4s ease 1.1s forwards; }
    .sub { color: white; font-size: 36px; text-align: center; font-weight: 600; 
      opacity: 0; animation: fadeIn 0.5s ease 1.4s forwards; }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${bg64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">
      <div class="badge">HVAC Technician Training</div>
      <h1>${esc(title)}</h1>
      <div class="bar"></div>
      <div class="sub">${esc(subtitle)}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── OBJECTIVE SLIDE — "In this lesson you will learn..." ───────

export function objectiveSlideHTML(lessonTitle: string, objectives: string[], delays: number[]): string {
  const items = objectives.map((o, i) => {
    const d = delays[i] ?? (1.2 + i * 1.8);
    return `<div class="obj" style="animation-delay:${d.toFixed(2)}s">
      <div class="bullet" style="animation-delay:${d.toFixed(2)}s">&#9679;</div>
      <div class="tx">${esc(o)}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    body { background: #0f172a; }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; padding: 60px 100px; z-index: 5; }
    .lesson-label { color: #f59e0b; font-size: 22px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
      opacity: 0; animation: fadeIn 0.3s ease 0.2s forwards; }
    h2 { color: white; font-size: 52px; font-weight: 800; margin-bottom: 12px;
      opacity: 0; animation: slideUp 0.4s ease 0.4s forwards; }
    .intro { color: #94a3b8; font-size: 36px; font-weight: 500; margin-bottom: 36px;
      opacity: 0; animation: fadeIn 0.4s ease 0.7s forwards; }
    .bar { width: 80px; height: 5px; background: #10b981; border-radius: 3px; margin-bottom: 36px;
      transform: scaleX(0); animation: barGrow 0.3s ease 0.6s forwards; }
    .objs { display: flex; flex-direction: column; gap: 20px; }
    .obj { display: flex; align-items: flex-start; gap: 20px; background: rgba(255,255,255,0.06); border-radius: 16px; padding: 22px 32px; border: 1px solid rgba(255,255,255,0.1);
      opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .bullet { color: #10b981; font-size: 20px; margin-top: 6px; flex-shrink: 0;
      opacity: 0; animation: popIn 0.3s ease forwards; }
    .tx { font-size: 42px; color: white; font-weight: 600; line-height: 1.35; }
  </style></head><body>
    ${hdr()}
    <div class="c">
      <div class="lesson-label">Learning Objectives</div>
      <h2>${esc(lessonTitle)}</h2>
      <div class="bar"></div>
      <div class="intro">In this lesson, you will learn:</div>
      <div class="objs">${items}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── SECTION SLIDE ──────────────────────────────────────────────

export function sectionSlideHTML(num: string, title: string, bg64: string): string {
  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: rgba(0,0,0,0.3); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 5; }
    .num { font-size: 200px; font-weight: 900; color: #f59e0b; line-height: 1; 
      opacity: 0; animation: popIn 0.5s ease 0.3s forwards; }
    .t { font-size: 60px; font-weight: 800; color: white; margin-top: -10px; text-align: center; padding: 0 80px; 
      opacity: 0; animation: slideUp 0.5s ease 0.7s forwards; }
    .bar { width: 80px; height: 5px; background: #10b981; border-radius: 3px; margin-top: 20px;
      transform: scaleX(0); animation: barGrow 0.4s ease 1.0s forwards; }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${bg64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">
      <div class="num">${esc(num)}</div>
      <div class="t">${esc(title)}</div>
      <div class="bar"></div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── BULLETS SLIDE ──────────────────────────────────────────────

export function bulletsSlideHTML(heading: string, bullets: string[], bg64: string, delays: number[]): string {
  const items = bullets.map((b, i) => {
    const d = delays[i] ?? (1.0 + i * 1.5);
    return `<div class="b" style="animation-delay:${d.toFixed(2)}s">
      <div class="ic" style="animation-delay:${d.toFixed(2)}s">${i + 1}</div>
      <div class="tx">${esc(b)}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: rgba(0,0,0,0.4); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; padding: 52px 80px; z-index: 5; }
    h2 { color: white; font-size: 52px; font-weight: 800; 
      opacity: 0; animation: slideUp 0.4s ease 0.3s forwards; }
    .bar { width: 80px; height: 5px; background: #f59e0b; border-radius: 3px; margin: 12px 0 32px;
      transform: scaleX(0); animation: barGrow 0.3s ease 0.5s forwards; }
    .bs { display: flex; flex-direction: column; gap: 18px; }
    .b { display: flex; align-items: center; gap: 22px; background: rgba(0,0,0,0.35); backdrop-filter: blur(10px); border-radius: 16px; padding: 22px 32px; border: 1px solid rgba(255,255,255,0.15);
      opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .ic { width: 48px; height: 48px; border-radius: 50%; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; flex-shrink: 0;
      opacity: 0; animation: popIn 0.35s ease forwards; }
    .tx { font-size: 42px; color: white; font-weight: 600;  line-height: 1.3; }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${bg64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">
      <h2>${esc(heading)}</h2>
      <div class="bar"></div>
      <div class="bs">${items}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── DEMO SLIDE — photo with labeled callouts ───────────────────

export function demoSlideHTML(photo64: string, callouts: string[], delays: number[]): string {
  const items = callouts.map((c, i) => {
    const d = delays[i] ?? (1.0 + i * 2.0);
    const top = 110 + i * 90;
    return `<div class="co" style="top:${top}px; animation-delay:${d.toFixed(2)}s">
      <div class="num" style="animation-delay:${d.toFixed(2)}s">${i + 1}</div>
      <div class="label">${esc(c)}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: rgba(0,0,0,0.2); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; z-index: 5; }
    .co { position: absolute; left: 44px; display: flex; align-items: center; gap: 16px;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); border-radius: 14px; padding: 16px 28px;
      border: 1px solid rgba(255,255,255,0.2);
      opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .num { width: 44px; height: 44px; border-radius: 50%; background: #f59e0b; color: white;
      display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; flex-shrink: 0;
      opacity: 0; animation: popIn 0.35s ease forwards; }
    .label { font-size: 38px; color: white; font-weight: 700;  }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${photo64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">${items}</div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── DIAGRAM SLIDE ──────────────────────────────────────────────

export function diagramSlideHTML(caption: string, diag64: string): string {
  return `<!DOCTYPE html><html><head><style>${base()}
    body { background: #f1f5f9; }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 50px; z-index: 5; }
    .fr { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      opacity: 0; animation: scaleIn 0.5s ease 0.3s forwards; }
    .fr img { max-width: 1560px; max-height: 700px; object-fit: contain; border-radius: 8px; display: block; }
    .cap { font-size: 30px; color: #334155; font-weight: 600; text-align: center; margin-top: 18px;
      opacity: 0; animation: fadeIn 0.4s ease 0.7s forwards; }
    .dot { display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 12px; vertical-align: middle; }
  </style></head><body>
    ${hdr()}
    <div class="c">
      <div class="fr"><img src="data:image/png;base64,${diag64}" /></div>
      <div class="cap"><span class="dot"></span>${esc(caption)}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── SPLIT SLIDE — bullets left, diagram right ──────────────────

export function splitSlideHTML(heading: string, bullets: string[], diag64: string, bg64: string, delays: number[]): string {
  const items = bullets.map((b, i) => {
    const d = delays[i] ?? (1.0 + i * 1.5);
    return `<div class="it" style="animation-delay:${d.toFixed(2)}s"><div class="dot" style="animation-delay:${d.toFixed(2)}s"></div><div class="tx">${esc(b)}</div></div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: linear-gradient(90deg, rgba(0,0,0,0.5) 46%, rgba(0,0,0,0.15) 100%); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; z-index: 5; }
    .left { flex: 1; padding: 60px 48px; display: flex; flex-direction: column; justify-content: center; }
    .right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .right .fr { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      opacity: 0; animation: slideLeft 0.5s ease 0.4s forwards; }
    .right img { max-width: 100%; max-height: 580px; object-fit: contain; border-radius: 8px; display: block; }
    h2 { color: white; font-size: 48px; font-weight: 800; margin-bottom: 28px; 
      opacity: 0; animation: slideUp 0.4s ease 0.3s forwards; }
    .it { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 22px;
      opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .dot { width: 14px; height: 14px; border-radius: 50%; background: #f59e0b; margin-top: 10px; flex-shrink: 0;
      opacity: 0; animation: popIn 0.3s ease forwards; }
    .tx { font-size: 42px; color: white; line-height: 1.35; font-weight: 600;  }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${bg64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">
      <div class="left"><h2>${esc(heading)}</h2>${items}</div>
      <div class="right"><div class="fr"><img src="data:image/png;base64,${diag64}" /></div></div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── SUMMARY SLIDE ──────────────────────────────────────────────

export function summarySlideHTML(takeaways: string[], bg64: string, delays: number[]): string {
  const items = takeaways.map((t, i) => {
    const d = delays[i] ?? (1.0 + i * 1.5);
    return `<div class="it" style="animation-delay:${d.toFixed(2)}s">
      <div class="chk" style="animation-delay:${(d + 0.1).toFixed(2)}s">&#10003;</div>
      <div class="tx">${esc(t)}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    .dim { background: rgba(0,0,0,0.35); }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; padding: 52px 100px; z-index: 5; }
    h2 { color: #f59e0b; font-size: 56px; font-weight: 900; 
      opacity: 0; animation: slideUp 0.4s ease 0.3s forwards; }
    .bar { width: 80px; height: 5px; background: #10b981; border-radius: 3px; margin: 12px 0 36px;
      transform: scaleX(0); animation: barGrow 0.3s ease 0.5s forwards; }
    .its { display: flex; flex-direction: column; gap: 20px; }
    .it { display: flex; align-items: center; gap: 22px; background: rgba(0,0,0,0.35); backdrop-filter: blur(10px); border-radius: 16px; padding: 22px 32px; border: 1px solid rgba(255,255,255,0.15);
      opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .chk { width: 50px; height: 50px; border-radius: 50%; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0;
      opacity: 0; animation: popIn 0.35s ease forwards; }
    .tx { font-size: 42px; color: white; font-weight: 600;  line-height: 1.3; }
  </style></head><body>
    <div class="bg" style="background-image:url(data:image/jpeg;base64,${bg64})"></div>
    <div class="dim"></div>${hdr()}
    <div class="c">
      <h2>Key Takeaways</h2>
      <div class="bar"></div>
      <div class="its">${items}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── QUIZ SLIDE — knowledge check questions ─────────────────────

export function quizSlideHTML(questions: { question: string; options: string[]; answer: number }[], delays: number[]): string {
  const items = questions.map((q, i) => {
    const d = delays[i] ?? (1.0 + i * 4.0);
    const opts = q.options.map((o, j) => {
      const letter = String.fromCharCode(65 + j); // A, B, C, D
      return `<div class="opt">
        <span class="letter">${letter}</span>
        <span class="otx">${esc(o)}</span>
      </div>`;
    }).join('');

    return `<div class="q" style="animation-delay:${d.toFixed(2)}s">
      <div class="qnum">${i + 1}</div>
      <div class="qbody">
        <div class="qtx">${esc(q.question)}</div>
        <div class="opts">${opts}</div>
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    body { background: #0f172a; }
    
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; padding: 52px 80px; z-index: 5; }
    .label { color: #f59e0b; font-size: 22px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
      opacity: 0; animation: fadeIn 0.3s ease 0.2s forwards; }
    h2 { color: white; font-size: 52px; font-weight: 800; margin-bottom: 36px;
      opacity: 0; animation: slideUp 0.4s ease 0.3s forwards; }
    .qs { display: flex; flex-direction: column; gap: 28px; }
    .q { display: flex; gap: 20px; opacity: 0; animation: slideLeft 0.4s ease forwards; }
    .qnum { width: 48px; height: 48px; border-radius: 50%; background: #f59e0b; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; flex-shrink: 0; margin-top: 2px; }
    .qbody { flex: 1; }
    .qtx { font-size: 40px; color: white; font-weight: 700; margin-bottom: 12px; line-height: 1.3; }
    .opts { display: flex; flex-wrap: wrap; gap: 10px; }
    .opt { background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 20px; display: flex; align-items: center; gap: 10px; }
    .letter { color: #94a3b8; font-size: 22px; font-weight: 800; }
    .otx { color: white; font-size: 34px; font-weight: 600; }
    .cta { color: #10b981; font-size: 28px; font-weight: 700; margin-top: 28px; opacity: 0; animation: fadeIn 0.4s ease 2s forwards; }
  </style></head><body>
    ${hdr()}
    <div class="c">
      <div class="label">Knowledge Check</div>
      <h2>Quick Review</h2>
      <div class="qs">${items}</div>
      <div class="cta">Answer these questions in the quiz below the video.</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}

// ─── FLOWCHART SLIDE — component breakdown with arrows and sub-bullets ──

// ─── FLOWCHART SLIDE — component breakdown with arrows and sub-bullets ──

export function flowchartSlideHTML(
  title: string,
  nodes: { label: string; description: string; bullets?: string[] }[],
  delays: number[]
): string {
  const items = nodes.map((n, i) => {
    const d = delays[i] ?? (2.0 + i * 5.0);

    const subs = (n.bullets || []).map((b, bi) => {
      const subDelay = d + 0.8 + bi * 0.6;
      return `<div class="sub-bullet" style="animation-delay:${subDelay.toFixed(2)}s">
        <span class="sub-dot">&#8226;</span>
        <span class="sub-tx">${esc(b)}</span>
      </div>`;
    }).join('');

    const arrow = i < nodes.length - 1
      ? `<div class="arrow" style="animation-delay:${(d + 1.5).toFixed(2)}s">&#9660;</div>`
      : '';

    return `<div class="node" style="animation-delay:${d.toFixed(2)}s">
      <div class="node-num">${i + 1}</div>
      <div class="node-body">
        <div class="node-label">${esc(n.label)}</div>
        <div class="node-desc">${esc(n.description)}</div>
        ${subs ? `<div class="subs">${subs}</div>` : ''}
      </div>
    </div>${arrow}`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>${base()}
    body { background: #0f172a; }
    .c { position: absolute; top: 56px; left: 0; right: 0; bottom: 6px; display: flex; flex-direction: column; padding: 44px 60px; z-index: 5; overflow: hidden; }
    .title-row { margin-bottom: 24px; }
    .title-label { color: #f59e0b; font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;
      opacity: 0; animation: fadeIn 0.3s ease 0.2s forwards; }
    h2 { color: white; font-size: 44px; font-weight: 800;
      opacity: 0; animation: slideUp 0.4s ease 0.4s forwards; }
    .flow { display: flex; flex-direction: column; align-items: stretch; gap: 0; flex: 1; }
    .node { background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.12); border-radius: 16px;
      padding: 18px 24px; display: flex; gap: 16px; align-items: flex-start;
      opacity: 0; animation: scaleIn 0.4s ease forwards; }
    .node-num { width: 42px; height: 42px; border-radius: 50%; background: #10b981; color: white;
      display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
    .node-body { flex: 1; }
    .node-label { color: white; font-size: 34px; font-weight: 700; line-height: 1.2; }
    .node-desc { color: #cbd5e1; font-size: 24px; font-weight: 500; line-height: 1.3; margin-top: 4px; }
    .subs { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
    .sub-bullet { display: flex; align-items: flex-start; gap: 10px;
      opacity: 0; animation: slideLeft 0.3s ease forwards; }
    .sub-dot { color: #f59e0b; font-size: 20px; line-height: 1.4; flex-shrink: 0; }
    .sub-tx { color: #94a3b8; font-size: 22px; font-weight: 500; line-height: 1.4; }
    .arrow { color: #f59e0b; font-size: 24px; text-align: center; padding: 6px 0;
      opacity: 0; animation: fadeIn 0.3s ease forwards; }
  </style></head><body>
    ${hdr()}
    <div class="c">
      <div class="title-row">
        <div class="title-label">Component Breakdown</div>
        <h2>${esc(title)}</h2>
      </div>
      <div class="flow">${items}</div>
    </div>
    <div class="ftr"></div>
  </body></html>`;
}
