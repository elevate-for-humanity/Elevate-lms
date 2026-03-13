/**
 * SCORM 1.2 + 2004 export for HVAC EPA 608 course.
 *
 * Generates a zip file containing:
 *   - imsmanifest.xml (course structure)
 *   - Per-lesson HTML files (standalone player with video + quiz)
 *   - SCORM API wrapper (reports score, completion, time)
 *   - Shared assets (CSS, JS)
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/export-scorm.ts
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/export-scorm.ts --format 2004
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const OUT_DIR = path.resolve('temp/scorm-export');
const GEN_DIR = path.resolve('temp/generated-lessons');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const format = args.includes('--format') && args[args.indexOf('--format') + 1] === '2004' ? '2004' : '1.2';

// ── SCORM API wrapper ──────────────────────────────────────────────────

const SCORM_API_JS = `
// SCORM 1.2 / 2004 API wrapper
var API = null;
var API_1484_11 = null;

function findAPI(win) {
  var attempts = 0;
  while (win && !win.API && !win.API_1484_11 && attempts < 10) {
    if (win.parent && win.parent !== win) { win = win.parent; }
    else if (win.opener) { win = win.opener; }
    else { break; }
    attempts++;
  }
  API = win.API || null;
  API_1484_11 = win.API_1484_11 || null;
}

function scormInit() {
  findAPI(window);
  if (API) { API.LMSInitialize(""); }
  else if (API_1484_11) { API_1484_11.Initialize(""); }
}

function scormSetScore(score) {
  if (API) {
    API.LMSSetValue("cmi.core.score.raw", String(score));
    API.LMSSetValue("cmi.core.score.min", "0");
    API.LMSSetValue("cmi.core.score.max", "100");
  } else if (API_1484_11) {
    API_1484_11.SetValue("cmi.score.raw", String(score));
    API_1484_11.SetValue("cmi.score.min", "0");
    API_1484_11.SetValue("cmi.score.max", "100");
  }
}

function scormSetComplete(passed) {
  if (API) {
    API.LMSSetValue("cmi.core.lesson_status", passed ? "passed" : "failed");
    API.LMSCommit("");
  } else if (API_1484_11) {
    API_1484_11.SetValue("cmi.completion_status", "completed");
    API_1484_11.SetValue("cmi.success_status", passed ? "passed" : "failed");
    API_1484_11.Commit("");
  }
}

function scormFinish() {
  if (API) { API.LMSFinish(""); }
  else if (API_1484_11) { API_1484_11.Terminate(""); }
}

window.addEventListener("load", scormInit);
window.addEventListener("beforeunload", scormFinish);
`;

// ── Lesson HTML template ───────────────────────────────────────────────

function generateLessonHTML(
  lesson: { title: string; lesson_number: number; video_url: string },
  quiz: any[],
  captions: any[]
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.title}</title>
  <script src="../shared/scorm-api.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .container { max-width: 900px; margin: 0 auto; padding: 16px; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 16px; }
    
    /* Video */
    .video-wrap { position: sticky; top: 0; z-index: 10; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
    video { width: 100%; display: block; }
    
    /* Transcript */
    .transcript { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; max-height: 250px; overflow-y: auto; }
    .transcript-header { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 0.875rem; color: #475569; }
    .transcript-body { padding: 8px; }
    .seg { padding: 8px 12px; border-radius: 8px; cursor: pointer; display: flex; gap: 12px; margin-bottom: 4px; }
    .seg:hover { background: #f1f5f9; }
    .seg.active { background: #eff6ff; border: 2px solid #3b82f6; }
    .seg-time { font-family: monospace; font-size: 0.8rem; color: #94a3b8; min-width: 3rem; }
    .seg-text { font-size: 0.9rem; line-height: 1.5; }
    
    /* Quiz */
    .quiz { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .quiz h2 { font-size: 1.25rem; margin-bottom: 4px; }
    .quiz-info { color: #64748b; font-size: 0.875rem; margin-bottom: 20px; }
    .question { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; }
    .option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
    .option:hover { border-color: #94a3b8; background: #f8fafc; }
    .option.selected { border-color: #3b82f6; background: #eff6ff; }
    .option.correct { border-color: #22c55e; background: #f0fdf4; }
    .option.wrong { border-color: #ef4444; background: #fef2f2; }
    .option.dimmed { opacity: 0.5; }
    .option-letter { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #94a3b8; flex-shrink: 0; }
    .option.correct .option-letter { background: #22c55e; color: #fff; border-color: #22c55e; }
    .option.wrong .option-letter { background: #ef4444; color: #fff; border-color: #ef4444; }
    .feedback { margin-top: 16px; padding: 16px; border-radius: 12px; border: 2px solid; }
    .feedback.correct { background: #f0fdf4; border-color: #86efac; }
    .feedback.wrong { background: #fffbeb; border-color: #fcd34d; }
    .feedback h3 { font-size: 1rem; margin-bottom: 4px; }
    .feedback p { font-size: 0.9rem; line-height: 1.5; }
    .btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; color: #fff; cursor: pointer; margin-top: 12px; }
    .btn-blue { background: #2563eb; }
    .btn-blue:hover { background: #1d4ed8; }
    .btn-green { background: #16a34a; }
    .btn-green:hover { background: #15803d; }
    .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; margin-bottom: 16px; }
    .progress-fill { height: 100%; background: #2563eb; border-radius: 4px; transition: width 0.3s; }
    .results { text-align: center; padding: 32px; }
    .results h2 { font-size: 1.5rem; margin-bottom: 8px; }
    .score { font-size: 3rem; font-weight: 700; }
    .score.pass { color: #16a34a; }
    .score.fail { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${lesson.title}</h1>
    <p class="subtitle">Lesson ${lesson.lesson_number} — HVAC EPA 608 Certification</p>
    
    <div class="video-wrap">
      <video id="player" controls preload="metadata">
        <source src="${lesson.video_url}" type="video/mp4">
      </video>
    </div>
    
    <div class="transcript" id="transcript">
      <div class="transcript-header">Transcript</div>
      <div class="transcript-body" id="transcript-body"></div>
    </div>
    
    <div class="quiz" id="quiz"></div>
  </div>
  
  <script>
    // Captions
    var captions = ${JSON.stringify(captions)};
    var video = document.getElementById("player");
    var tbody = document.getElementById("transcript-body");
    
    captions.forEach(function(seg, i) {
      var div = document.createElement("div");
      div.className = "seg";
      div.dataset.idx = i;
      var m = Math.floor(seg.start / 60);
      var s = Math.floor(seg.start % 60);
      div.innerHTML = '<span class="seg-time">' + m + ':' + (s < 10 ? '0' : '') + s + '</span><span class="seg-text">' + seg.text + '</span>';
      div.onclick = function() { video.currentTime = seg.start; video.play(); };
      tbody.appendChild(div);
    });
    
    video.addEventListener("timeupdate", function() {
      var t = video.currentTime;
      var segs = tbody.querySelectorAll(".seg");
      segs.forEach(function(el, i) {
        if (t >= captions[i].start && t < captions[i].end) {
          el.className = "seg active";
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          el.className = "seg";
        }
      });
    });
    
    // Quiz
    var questions = ${JSON.stringify(quiz)};
    var currentQ = 0;
    var correctCount = 0;
    var answered = [];
    var quizDiv = document.getElementById("quiz");
    
    function renderQuestion() {
      if (currentQ >= questions.length) { renderResults(); return; }
      var q = questions[currentQ];
      var pct = ((currentQ + 1) / questions.length * 100).toFixed(0);
      var html = '<h2>Lesson Quiz</h2><p class="quiz-info">Question ' + (currentQ + 1) + ' of ' + questions.length + ' — 80% to pass</p>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '<p class="question">' + q.question + '</p>';
      q.options.forEach(function(opt, i) {
        html += '<div class="option" data-idx="' + i + '" onclick="selectAnswer(' + i + ')"><span class="option-letter">' + String.fromCharCode(65 + i) + '</span><span>' + opt + '</span></div>';
      });
      html += '<div id="feedback" style="display:none"></div>';
      quizDiv.innerHTML = html;
    }
    
    function selectAnswer(idx) {
      var q = questions[currentQ];
      var opts = quizDiv.querySelectorAll(".option");
      var isCorrect = idx === q.correctAnswer;
      if (isCorrect) correctCount++;
      answered.push({ q: currentQ, selected: idx, correct: isCorrect });
      
      opts.forEach(function(el, i) {
        el.onclick = null;
        if (i === q.correctAnswer) el.className = "option correct";
        else if (i === idx && !isCorrect) el.className = "option wrong";
        else el.className = "option dimmed";
      });
      
      var fb = document.getElementById("feedback");
      fb.style.display = "block";
      if (isCorrect) {
        fb.className = "feedback correct";
        fb.innerHTML = '<h3>Correct!</h3><p>' + (q.explanation || '') + '</p>';
      } else {
        fb.className = "feedback wrong";
        fb.innerHTML = '<h3>Not quite.</h3><p>The correct answer is: <strong>' + q.options[q.correctAnswer] + '</strong></p><p>' + (q.explanation || '') + '</p>';
      }
      
      var isLast = currentQ === questions.length - 1;
      fb.innerHTML += '<button class="btn ' + (isLast ? 'btn-green' : 'btn-blue') + '" onclick="nextQuestion()">' + (isLast ? 'See Results' : 'Next Question') + '</button>';
    }
    
    function nextQuestion() {
      currentQ++;
      renderQuestion();
    }
    
    function renderResults() {
      var score = Math.round(correctCount / questions.length * 100);
      var passed = score >= 80;
      scormSetScore(score);
      scormSetComplete(passed);
      
      var html = '<div class="results">';
      html += '<h2>' + (passed ? 'Congratulations!' : 'Keep Studying') + '</h2>';
      html += '<p class="score ' + (passed ? 'pass' : 'fail') + '">' + score + '%</p>';
      html += '<p>' + correctCount + ' of ' + questions.length + ' correct' + (passed ? ' — You passed!' : ' — Need 80% to pass') + '</p>';
      html += '<button class="btn btn-blue" onclick="retake()" style="max-width:300px;margin:16px auto 0">Retake Quiz</button>';
      html += '</div>';
      quizDiv.innerHTML = html;
    }
    
    function retake() {
      currentQ = 0; correctCount = 0; answered = [];
      renderQuestion();
    }
    
    renderQuestion();
  <\/script>
</body>
</html>`;
}

// ── imsmanifest.xml ────────────────────────────────────────────────────

function generateManifest(
  lessons: { lesson_number: number; title: string }[],
  scormFormat: string
): string {
  if (scormFormat === '2004') {
    let items = '';
    let resources = '';
    for (const l of lessons) {
      const id = `lesson_${l.lesson_number}`;
      items += `      <item identifier="${id}" identifierref="res_${id}">
        <title>${escapeXml(l.title)}</title>
      </item>\n`;
      resources += `    <resource identifier="res_${id}" type="webcontent" adlcp:scormType="sco" href="lessons/lesson-${l.lesson_number}.html">
      <file href="lessons/lesson-${l.lesson_number}.html"/>
    </resource>\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="elevate-hvac-608" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="elevate_org">
    <organization identifier="elevate_org">
      <title>HVAC Technician Training — EPA 608 Certification</title>
${items}
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_shared" type="webcontent" href="shared/scorm-api.js">
      <file href="shared/scorm-api.js"/>
    </resource>
${resources}
  </resources>
</manifest>`;
  }

  // SCORM 1.2
  let items = '';
  let resources = '';
  for (const l of lessons) {
    const id = `lesson_${l.lesson_number}`;
    items += `      <item identifier="${id}" identifierref="res_${id}">
        <title>${escapeXml(l.title)}</title>
      </item>\n`;
    resources += `    <resource identifier="res_${id}" type="webcontent" adlcp:scormtype="sco" href="lessons/lesson-${l.lesson_number}.html">
      <file href="lessons/lesson-${l.lesson_number}.html"/>
    </resource>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="elevate-hvac-608" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="elevate_org">
    <organization identifier="elevate_org">
      <title>HVAC Technician Training — EPA 608 Certification</title>
${items}
    </organization>
  </organizations>
  <resources>
${resources}
  </resources>
</manifest>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== SCORM ${format} Export ===\n`);

  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('id, lesson_number, title, video_url')
    .eq('course_id', COURSE_ID)
    .order('lesson_number');

  if (!lessons) { console.error('No lessons found'); process.exit(1); }

  // Clean and create output dirs
  const exportDir = path.join(OUT_DIR, `scorm-${format.replace('.', '')}`);
  if (fs.existsSync(exportDir)) fs.rmSync(exportDir, { recursive: true });
  fs.mkdirSync(path.join(exportDir, 'lessons'), { recursive: true });
  fs.mkdirSync(path.join(exportDir, 'shared'), { recursive: true });

  // Write SCORM API
  fs.writeFileSync(path.join(exportDir, 'shared', 'scorm-api.js'), SCORM_API_JS);

  // Generate lesson HTML files
  let count = 0;
  for (const lesson of lessons) {
    const lessonDir = path.join(GEN_DIR, `lesson-${lesson.lesson_number}`);
    
    let quiz: any[] = [];
    let captions: any[] = [];
    
    const quizPath = path.join(lessonDir, 'quiz.json');
    if (fs.existsSync(quizPath)) quiz = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
    
    const captionPath = path.join(lessonDir, 'captions.json');
    if (fs.existsSync(captionPath)) captions = JSON.parse(fs.readFileSync(captionPath, 'utf-8'));

    const html = generateLessonHTML(
      { title: lesson.title, lesson_number: lesson.lesson_number, video_url: lesson.video_url || '' },
      quiz,
      captions
    );

    fs.writeFileSync(
      path.join(exportDir, 'lessons', `lesson-${lesson.lesson_number}.html`),
      html
    );
    count++;
  }

  // Write manifest
  fs.writeFileSync(
    path.join(exportDir, 'imsmanifest.xml'),
    generateManifest(lessons, format)
  );

  // Create zip
  const zipName = `Elevate-HVAC-EPA608-SCORM${format.replace('.', '')}.zip`;
  const zipPath = path.join(OUT_DIR, zipName);
  execSync(`cd "${exportDir}" && zip -r "${zipPath}" . 2>/dev/null`);

  const zipSize = fs.statSync(zipPath).size;
  console.log(`Lessons exported: ${count}`);
  console.log(`Format: SCORM ${format}`);
  console.log(`Output: ${zipPath}`);
  console.log(`Size: ${(zipSize / 1024).toFixed(0)} KB`);
  console.log(`\nThis zip can be uploaded to any LMS that supports SCORM ${format}.`);
}

main().catch(console.error);
