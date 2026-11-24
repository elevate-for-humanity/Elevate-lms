/**
 * Exercise the generated, private HTML document through actual DOM events.
 * JSDOM is used when this workspace has no executable browser. This is not
 * a visual browser or screen-reader certification.
 *
 * node scripts/course-builder/test-manufacturing-practice.mjs OUTPUT_HTML
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import jsdom from 'jsdom';

const { JSDOM, VirtualConsole, requestInterceptor } = jsdom;

const source = resolve(process.argv[2] ?? '../course-build/output/Interactive_Practice.html');
const html = await readFile(source, 'utf8');
const storageKey = 'elevate:manufacturing-practice:v1';
const errors = [];
const requestedResources = [];
function createDocument(saved = null, storageFails = false) {
  let exportedBlob = null;
  let downloadedName = null;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://offline-practice.invalid/Interactive_Practice.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: { interceptors: [requestInterceptor((request) => {
      requestedResources.push(request.url);
      return new Response('', { status: 403 });
    })] },
    virtualConsole,
    beforeParse(window) {
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.Blob = Blob;
      window.URL.createObjectURL = (blob) => { exportedBlob = blob; return 'blob:private-practice-export'; };
      window.URL.revokeObjectURL = function () {};
      window.HTMLAnchorElement.prototype.click = function () { downloadedName = this.download; };
      window.fetch = () => { throw new Error('The offline companion must not fetch any resource.'); };
      if (saved) window.localStorage.setItem(storageKey,saved);
      if (storageFails) window.Storage.prototype.setItem = function () { throw new Error('Storage unavailable'); };
    },
  });
  const { window } = dom;
  const document = window.document;
  function all(selector) { return [...document.querySelectorAll(selector)]; }
  function one(selector) { const node = document.querySelector(selector); assert.ok(node,'Missing element ' + selector); return node; }
  function click(selector) { const node = one(selector); assert.equal(node.disabled,false,'Disabled action ' + selector); node.click(); return node; }
  function input(selector,value) { const node = one(selector); node.value = String(value); node.dispatchEvent(new window.Event('input',{bubbles:true})); return node; }
  function navigate(id) { const node = all('[data-action="navigate"]').find((item) => item.dataset.lesson === id); assert.ok(node,'Missing lesson ' + id); node.click(); }
  function taskNode(id) { const node = all('[data-task-fieldset]').find((item) => item.dataset.taskFieldset === id); assert.ok(node,'Missing task ' + id); return node; }
  function setTask(task,value) {
    if (task.type === 'choice') {
      const radio = all('[data-sim-choice]').find((node) => node.dataset.simChoice === task.id && node.value === value);
      assert.ok(radio); radio.click();
    } else if (task.type === 'number') {
      const node = all('[data-sim-number]').find((item) => item.dataset.simNumber === task.id);
      assert.ok(node); node.value = String(value); node.dispatchEvent(new window.Event('input',{bubbles:true}));
    } else {
      const prefix = 'step-' + task.id + '-';
      for (let target = 0; target < value.length; target += 1) {
        let order = [...taskNode(task.id).querySelectorAll('li')].map((node) => node.id.slice(prefix.length));
        let position = order.indexOf(value[target]);
        assert.ok(position >= target);
        while (position > target) {
          const button = [...taskNode(task.id).querySelectorAll('[data-action="move"]')]
            .find((node) => Number(node.dataset.position) === position && node.dataset.direction === '-1');
          assert.ok(button); button.click(); position -= 1;
          assert.equal(document.activeElement.id,prefix + value[target],'Focus did not follow the moved step');
          assert.match(one('#sequence-announcement').textContent,/moved to step/);
          order = [...taskNode(task.id).querySelectorAll('li')].map((node) => node.id.slice(prefix.length));
          assert.equal(order[position],value[target]);
        }
      }
      taskNode(task.id).querySelector('[data-action="confirm-sequence"]').click();
    }
  }
  async function restore(raw) {
    const target = one('#restore-work');
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    Object.defineProperty(target,'files',{configurable:true,value:[{size:Buffer.byteLength(text),text:async () => text}]});
    target.dispatchEvent(new window.Event('change',{bubbles:true}));
    await new Promise((done) => setImmediate(done));
  }
  return {dom,window,document,all,one,click,input,navigate,setTask,restore,
    exported:() => exportedBlob,downloadName:() => downloadedName};
}

const primary = createDocument();
const course = JSON.parse(primary.one('#course-data').textContent);
assert.equal(course.lessons.length,24);
assert.equal(course.simulations.length,10);
assert.equal(primary.all('[data-action="navigate"]').length,24);
assert.equal(primary.all('textarea[data-workbook]').length,5);
assert.match(primary.document.body.textContent,/no LMS credit or equipment authorization/);
assert.equal(primary.all('script[src],link[rel="stylesheet"],iframe,form').length,0);

// Written work survives navigation and a full document reload.
for (const field of ['notes','practice1','practice2','practice3','nextGoal'])
  primary.input('#workbook-' + field,'Fictional case evidence and a documented next step for ' + field + '.');
primary.one('#workbook-reviewed').click();
primary.navigate(course.lessons[1].id);
primary.navigate(course.lessons[0].id);
assert.match(primary.one('#workbook-notes').value,/Fictional case evidence/);
const savedWriting = primary.window.localStorage.getItem(storageKey);
const reloaded = createDocument(savedWriting);
assert.equal(reloaded.one('#workbook-practice3').value,primary.one('#workbook-practice3').value);
assert.equal(reloaded.one('#workbook-reviewed').checked,true);
reloaded.window.close();

// A critical error blocks mastery even when the arithmetic score reaches 80%.
const criticalScenario = course.simulations.find((wrapper) =>
  wrapper.spec.tasks.length === 5 && wrapper.spec.tasks.some((task) => task.critical && task.type === 'choice'));
assert.ok(criticalScenario);
primary.navigate(criticalScenario.lessonId);
for (const task of criticalScenario.spec.tasks) primary.setTask(task,task.expected);
const criticalTask = criticalScenario.spec.tasks.find((task) => task.critical && task.type === 'choice');
const wrong = criticalTask.options.find((option) => option.value !== criticalTask.expected).value;
primary.setTask(criticalTask,wrong);
primary.click('#check-simulation');
assert.match(primary.one('#simulation-result').textContent,/Review and retry.*80%/s);
assert.doesNotMatch(primary.one('#simulation-result').textContent,/Practice passed/);
primary.setTask(criticalTask,criticalTask.expected);
assert.equal(primary.one('#simulation-feedback').textContent,'');
primary.click('#check-simulation');
assert.match(primary.one('#simulation-result').textContent,/Practice passed.*100%/s);
assert.match(primary.one('#simulation-result').textContent,/Local attempt 2/);
primary.click('[data-action="reset-simulation"]');
assert.equal(primary.one('#check-simulation').disabled,true);
assert.match(primary.one('#sim-task-count').textContent,/0 of 5/);

// Every authored task is completed through the real document controls.
let taskCount = 0;
let numericZeroChecked = false;
let sequenceTasks = 0;
for (const wrapper of course.simulations) {
  primary.navigate(wrapper.lessonId);
  for (const task of wrapper.spec.tasks) {
    primary.setTask(task,task.expected);
    taskCount += 1;
    if (task.type === 'number' && task.expected === 0) {
      numericZeroChecked = true;
      const field = primary.all('[data-sim-number]').find((node) => node.dataset.simNumber === task.id);
      assert.equal(field.value,'0');
    }
    if (task.type === 'sequence') sequenceTasks += 1;
  }
  primary.click('#check-simulation');
  assert.match(primary.one('#simulation-result').textContent,/Practice passed.*100%/s);
  assert.equal(primary.document.activeElement.id,'simulation-result');
}
assert.equal(taskCount,69);
assert.equal(numericZeroChecked,true);
assert.match(primary.one('#local-progress').textContent,/10\/10 scenarios passed/);

// All lessons expose their full reading, five writing fields, and real checks.
let questionCount = 0;
for (const lesson of course.lessons) {
  primary.navigate(lesson.id);
  assert.equal(primary.one('#lesson-heading').textContent,lesson.title);
  assert.ok(primary.one('#reading .prose').textContent.length > 2000);
  assert.equal(primary.all('textarea[data-workbook]').length,5);
  for (const [index,question] of lesson.practiceQuestions.entries()) {
    const radio = primary.all('[data-knowledge]').find((node) =>
      Number(node.dataset.knowledge) === index && Number(node.value) === question.correctIndex);
    assert.ok(radio); radio.click(); questionCount += 1;
  }
  primary.click('#check-knowledge');
  assert.match(primary.one('#knowledge-result').textContent,/Knowledge review.*100%/s);
}
assert.match(primary.one('#local-progress').textContent,/24\/24 checks reviewed/);

// Export contains learner responses only; restore regrades, and rejects bad data.
primary.navigate(course.lessons[0].id);
primary.one('#export-work').click();
assert.equal(primary.downloadName(),'Elevate_Manufacturing_Practice_Backup.json');
const backup = JSON.parse(await primary.exported().text());
assert.equal(backup.format,course.format);
assert.equal(backup.lessons[course.lessons[0].id].reviewed,true);
assert.ok(!('content' in backup) && !('expected' in backup.simulations[criticalScenario.spec.id]));
const restored = createDocument();
await restored.restore(backup);
assert.match(restored.one('#global-message').textContent,/Practice restored/);
assert.match(restored.one('#workbook-notes').value,/Fictional case evidence/);
assert.match(restored.one('#local-progress').textContent,/10\/10 scenarios passed/);
await restored.restore('{"format":"unrelated"}');
assert.match(restored.one('#global-message').textContent,/not a compatible practice backup/);
assert.match(restored.one('#workbook-notes').value,/Fictional case evidence/);
const forged = structuredClone(backup);
forged.currentLesson = criticalScenario.lessonId;
forged.simulations[criticalScenario.spec.id].answers[criticalTask.id] = wrong;
forged.simulations[criticalScenario.spec.id].score = 100;
forged.simulations[criticalScenario.spec.id].completed = true;
forged.simulations[criticalScenario.spec.id].checked = true;
await restored.restore(forged);
assert.match(restored.one('#simulation-result').textContent,/Review and retry.*80%/s);
assert.match(restored.one('#local-progress').textContent,/9\/10 scenarios passed/);
const safeText = structuredClone(backup);
safeText.lessons[course.lessons[0].id].notes = '<img src="https://invalid.example" onerror="window.injected=true">';
await restored.restore(safeText);
assert.equal(restored.window.injected,undefined);
assert.equal(restored.all('#workbook img').length,0);
assert.match(restored.one('#workbook-notes').value,/<img/);
restored.window.close();

// Storage failure is visible and does not destroy the working export.
const noStorage = createDocument(null,true);
noStorage.input('#workbook-notes','Fictional practice stays available for export.');
assert.match(noStorage.one('#storage-notice').textContent,/unavailable or full/);
noStorage.one('#export-work').click();
assert.ok(noStorage.exported());
noStorage.window.close();
primary.window.close();
assert.deepEqual(requestedResources,[]);
assert.deepEqual(errors,[]);
console.log(JSON.stringify({
  document:source, runtime:'JSDOM (not a visual browser)', result:'passed',
  lessons:24,scenarios:10,simulationTasks:taskCount,sequenceTasks,knowledgeQuestions:questionCount,
  checks:['critical hold at 80%','correct retry','numeric zero','sequence order and focus','local saving','reload persistence',
    '24 lesson checks','JSON export and restore','forged score ignored','invalid backup preserves work','HTML text escaped','storage-failure export','no network requests'],
},null,2));
