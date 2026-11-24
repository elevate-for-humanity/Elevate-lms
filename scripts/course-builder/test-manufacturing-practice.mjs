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
function createSharedStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.has(String(key)) ? entries.get(String(key)) : null,
    setItem(key,value) { entries.set(String(key),String(value)); this.afterSet?.(String(key),String(value)); },
    removeItem: (key) => { entries.delete(String(key)); },
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    get length() { return entries.size; },
    afterSet: null,
  };
}
function createDocument(saved = null, storageFails = false, storage = createSharedStorage()) {
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
      // Each document has independent JavaScript state, sharing only storage.
      // No storage event is emitted: persistence must not depend on delivery.
      Object.defineProperty(window,'localStorage',{value:{
        getItem: (key) => storage.getItem(key),
        setItem: (key,value) => { if (storageFails) throw new Error('Storage unavailable'); storage.setItem(key,value); },
        removeItem: (key) => { if (storageFails) throw new Error('Storage unavailable'); storage.removeItem(key); },
        key: (index) => storage.key(index),
        get length() { return storage.length; },
      }});
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.Blob = Blob;
      window.URL.createObjectURL = (blob) => { exportedBlob = blob; return 'blob:private-practice-export'; };
      window.URL.revokeObjectURL = function () {};
      window.HTMLAnchorElement.prototype.click = function () { downloadedName = this.download; };
      window.fetch = (request) => { requestedResources.push(String(request)); throw new Error('The offline companion must not fetch any resource.'); };
      window.XMLHttpRequest.prototype.open = function (_method,url) { requestedResources.push(String(url)); throw new Error('The offline companion must not request any resource.'); };
      if (saved) storage.setItem(storageKey,saved);
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
  async function exportState() { one('#export-work').click(); return JSON.parse(await exportedBlob.text()); }
  return {dom,window,document,all,one,click,input,navigate,setTask,restore,storage,exportState,
    setStorageFails:(value) => { storageFails = value; },
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
const reloaded = createDocument(null,false,primary.storage);
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
assert.equal(questionCount,76);

// Export contains learner responses only; restore regrades, and rejects bad data.
primary.navigate(course.lessons[0].id);
primary.one('#export-work').click();
assert.equal(primary.downloadName(),'Elevate_Manufacturing_Practice_Backup.json');
const backup = JSON.parse(await primary.exported().text());
assert.equal(backup.format,course.format);
assert.equal(backup.lessons[course.lessons[0].id].reviewed,true);
assert.ok(!('content' in backup) && !('expected' in backup.simulations[criticalScenario.spec.id]));
// Backups written before field-level persistence remain readable as raw storage.
const legacyBackup = structuredClone(backup);
for (const lesson of Object.values(legacyBackup.lessons)) delete lesson.knowledgeCheckSignature;
for (const simulation of Object.values(legacyBackup.simulations)) delete simulation.checkSignature;
const legacy = createDocument(JSON.stringify(legacyBackup));
assert.equal(legacy.one('#workbook-notes').value,backup.lessons[course.lessons[0].id].notes);
assert.match(legacy.one('#local-progress').textContent,/10\/10 scenarios passed/);
legacy.input('#workbook-practice1','An edit after loading the legacy whole-document backup.');
const legacyReload = createDocument(null,false,legacy.storage);
assert.equal(legacyReload.one('#workbook-practice1').value,'An edit after loading the legacy whole-document backup.');
assert.equal(legacyReload.one('#workbook-notes').value,backup.lessons[course.lessons[0].id].notes);
legacyReload.window.close(); legacy.window.close();
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

// Alternating tabs retain edits across lessons and separate fields in one lesson.
const shared = createSharedStorage();
const tabA = createDocument(null,false,shared);
const tabB = createDocument(null,false,shared);
const firstLesson = course.lessons[0].id, secondLesson = course.lessons[1].id;
tabA.input('#workbook-notes','Tab A first-lesson notes.');
tabB.input('#workbook-practice1','Tab B separate field in the same lesson.');
tabA.input('#workbook-nextGoal','Tab A next goal.');
tabB.input('#workbook-practice2','Tab B second practice response.');
tabB.navigate(secondLesson);
tabB.input('#workbook-notes','Tab B second-lesson notes.');
tabA.input('#workbook-practice3','Tab A keeps working in the first lesson.');
tabB.input('#workbook-nextGoal','Tab B second-lesson goal.');
let sharedBackup = await tabA.exportState();
assert.equal(sharedBackup.lessons[firstLesson].notes,'Tab A first-lesson notes.');
assert.equal(sharedBackup.lessons[firstLesson].practice1,'Tab B separate field in the same lesson.');
assert.equal(sharedBackup.lessons[firstLesson].practice2,'Tab B second practice response.');
assert.equal(sharedBackup.lessons[firstLesson].practice3,'Tab A keeps working in the first lesson.');
assert.equal(sharedBackup.lessons[firstLesson].nextGoal,'Tab A next goal.');
assert.equal(sharedBackup.lessons[secondLesson].notes,'Tab B second-lesson notes.');
assert.equal(sharedBackup.lessons[secondLesson].nextGoal,'Tab B second-lesson goal.');

// Split one scenario across independent tabs; checks use the merged responses.
const mixedScenario = course.simulations.find((wrapper) => ['choice','number','sequence'].every((type) =>
  wrapper.spec.tasks.some((task) => task.type === type)));
assert.ok(mixedScenario);
tabA.navigate(mixedScenario.lessonId); tabB.navigate(mixedScenario.lessonId);
for (const [index,task] of mixedScenario.spec.tasks.entries()) (index % 2 ? tabB : tabA).setTask(task,task.expected);
assert.equal(tabA.one('#check-simulation').disabled,false,'Merged answers should enable the scenario check');
tabA.click('#check-simulation');
assert.match(tabA.one('#simulation-result').textContent,/Practice passed.*100%/s);
const changedTask = mixedScenario.spec.tasks.find((task) => task.type === 'choice');
const changedWrong = changedTask.options.find((option) => option.value !== changedTask.expected).value;
tabB.setTask(changedTask,changedWrong);
sharedBackup = await tabA.exportState();
assert.equal(sharedBackup.simulations[mixedScenario.spec.id].checked,false,'A stale unchecked tab must invalidate the other tab’s checked result');
assert.equal(sharedBackup.simulations[mixedScenario.spec.id].answers[changedTask.id],changedWrong);
tabB.setTask(changedTask,changedTask.expected);
tabB.click('#check-simulation');
tabA.click('#check-simulation');
sharedBackup = await tabB.exportState();
assert.equal(sharedBackup.simulations[mixedScenario.spec.id].attempts,3,'Alternating checks must not overwrite another tab’s attempt count');
for (const task of mixedScenario.spec.tasks) assert.deepEqual(sharedBackup.simulations[mixedScenario.spec.id].answers[task.id],task.expected);

// Knowledge responses use independent keys and clear a stale reviewed flag.
tabA.navigate(firstLesson); tabB.navigate(firstLesson);
const knowledgeLesson = course.lessons[0];
for (const [index,question] of knowledgeLesson.practiceQuestions.entries()) {
  const tab = index % 2 ? tabB : tabA;
  tab.one('[data-knowledge="' + index + '"][value="' + question.correctIndex + '"]').click();
}
const lastKnowledgeTab = (knowledgeLesson.practiceQuestions.length - 1) % 2 ? tabB : tabA;
assert.equal(lastKnowledgeTab.one('#check-knowledge').disabled,false);
lastKnowledgeTab.click('#check-knowledge');
const otherKnowledgeTab = lastKnowledgeTab === tabA ? tabB : tabA;
const wrongKnowledge = (knowledgeLesson.practiceQuestions[0].correctIndex + 1) % knowledgeLesson.practiceQuestions[0].options.length;
otherKnowledgeTab.one('[data-knowledge="0"][value="' + wrongKnowledge + '"]').click();
sharedBackup = await lastKnowledgeTab.exportState();
assert.equal(sharedBackup.lessons[firstLesson].knowledgeChecked,false);
otherKnowledgeTab.one('[data-knowledge="0"][value="' + knowledgeLesson.practiceQuestions[0].correctIndex + '"]').click();
otherKnowledgeTab.click('#check-knowledge');
lastKnowledgeTab.click('#check-knowledge');
sharedBackup = await otherKnowledgeTab.exportState();
assert.equal(sharedBackup.lessons[firstLesson].knowledgeAttempts,3);

// Numeric zero survives another tab’s edit and a full reload, then can be deleted.
const zeroScenario = course.simulations.find((wrapper) => wrapper.spec.tasks.some((task) => task.type === 'number' && task.expected === 0));
const zeroTask = zeroScenario.spec.tasks.find((task) => task.type === 'number' && task.expected === 0);
tabA.navigate(zeroScenario.lessonId); tabB.navigate(zeroScenario.lessonId);
tabA.setTask(zeroTask,0);
tabB.input('#workbook-notes','Tab B preserves a numeric zero while writing.');
sharedBackup = await tabB.exportState();
assert.equal(sharedBackup.simulations[zeroScenario.spec.id].answers[zeroTask.id],0);
const zeroReload = createDocument(null,false,shared);
zeroReload.navigate(zeroScenario.lessonId);
assert.equal(zeroReload.one('[data-sim-number="' + zeroTask.id + '"]').value,'0');
zeroReload.input('[data-sim-number="' + zeroTask.id + '"]','');
tabA.input('#workbook-nextGoal','An unrelated edit must not resurrect a deleted response.');
sharedBackup = await tabA.exportState();
assert.equal(Object.hasOwn(sharedBackup.simulations[zeroScenario.spec.id].answers,zeroTask.id),false);
zeroReload.window.close();

// Reset clears answers the resetting tab has never seen, and stale checks stay safe.
const resetStorage = createSharedStorage();
const resetA = createDocument(null,false,resetStorage), resetB = createDocument(null,false,resetStorage);
resetA.navigate(mixedScenario.lessonId); resetB.navigate(mixedScenario.lessonId);
for (const task of mixedScenario.spec.tasks) resetA.setTask(task,task.expected);
resetA.click('#check-simulation');
resetB.click('[data-action="reset-simulation"]');
resetA.click('#check-simulation');
assert.equal(resetA.one('#check-simulation').disabled,true);
assert.equal(resetA.one('#simulation-feedback').textContent,'');
const resetBackup = await resetA.exportState();
assert.deepEqual(resetBackup.simulations[mixedScenario.spec.id].answers,{});
assert.equal(resetBackup.simulations[mixedScenario.spec.id].checked,false);
assert.equal(resetBackup.simulations[mixedScenario.spec.id].attempts,1);
resetA.window.close(); resetB.window.close();

// A check interleaved with an answer write cannot certify a different response.
const scenarioRaceBackup = structuredClone(backup);
scenarioRaceBackup.currentLesson = criticalScenario.lessonId;
scenarioRaceBackup.simulations[criticalScenario.spec.id].answers[criticalTask.id] = wrong;
scenarioRaceBackup.simulations[criticalScenario.spec.id].checked = false;
const scenarioRaceStorage = createSharedStorage();
const scenarioRaceA = createDocument(JSON.stringify(scenarioRaceBackup),false,scenarioRaceStorage);
const scenarioRaceB = createDocument(null,false,scenarioRaceStorage);
let scenarioCheckInterleaved = false;
scenarioRaceStorage.afterSet = (key) => {
  if (!key.endsWith(JSON.stringify(['simulations',criticalScenario.spec.id,'checked']))) return;
  scenarioRaceStorage.afterSet = null;
  scenarioCheckInterleaved = true;
  scenarioRaceA.click('#check-simulation');
  assert.match(scenarioRaceA.one('#simulation-result').textContent,/Review and retry.*80%/s);
};
scenarioRaceB.setTask(criticalTask,criticalTask.expected);
assert.equal(scenarioCheckInterleaved,true);
assert.equal(scenarioRaceB.one('#simulation-feedback').textContent,'');
const scenarioRaceResult = await scenarioRaceB.exportState();
assert.equal(scenarioRaceResult.simulations[criticalScenario.spec.id].checked,false);
assert.equal(scenarioRaceResult.simulations[criticalScenario.spec.id].checkSignature,null);
assert.equal(scenarioRaceResult.simulations[criticalScenario.spec.id].answers[criticalTask.id],criticalTask.expected);
scenarioRaceB.click('#check-simulation');
assert.match(scenarioRaceB.one('#simulation-result').textContent,/Practice passed.*100%/s);
scenarioRaceA.window.close(); scenarioRaceB.window.close();

const knowledgeRaceBackup = structuredClone(backup);
knowledgeRaceBackup.currentLesson = firstLesson;
knowledgeRaceBackup.lessons[firstLesson].knowledgeAnswers[0] = wrongKnowledge;
knowledgeRaceBackup.lessons[firstLesson].knowledgeChecked = false;
const knowledgeRaceStorage = createSharedStorage();
const knowledgeRaceA = createDocument(JSON.stringify(knowledgeRaceBackup),false,knowledgeRaceStorage);
const knowledgeRaceB = createDocument(null,false,knowledgeRaceStorage);
let knowledgeCheckInterleaved = false;
knowledgeRaceStorage.afterSet = (key) => {
  if (!key.endsWith(JSON.stringify(['lessons',firstLesson,'knowledgeChecked']))) return;
  knowledgeRaceStorage.afterSet = null;
  knowledgeCheckInterleaved = true;
  knowledgeRaceA.click('#check-knowledge');
  assert.doesNotMatch(knowledgeRaceA.one('#knowledge-result').textContent,/100%/);
};
knowledgeRaceB.one('[data-knowledge="0"][value="' + knowledgeLesson.practiceQuestions[0].correctIndex + '"]').click();
assert.equal(knowledgeCheckInterleaved,true);
assert.equal(knowledgeRaceB.one('#knowledge-feedback').textContent,'');
const knowledgeRaceResult = await knowledgeRaceB.exportState();
assert.equal(knowledgeRaceResult.lessons[firstLesson].knowledgeChecked,false);
assert.equal(knowledgeRaceResult.lessons[firstLesson].knowledgeCheckSignature,null);
knowledgeRaceB.click('#check-knowledge');
assert.match(knowledgeRaceB.one('#knowledge-result').textContent,/100%/);
knowledgeRaceA.window.close(); knowledgeRaceB.window.close();

// An intentional backup replacement stays authoritative with an older tab open.
tabA.navigate(firstLesson); tabB.navigate(firstLesson);
const replacement = structuredClone(backup);
replacement.lessons[firstLesson].notes = 'Restored backup notes replace earlier writing.';
replacement.lessons[firstLesson].practice2 = '';
replacement.lessons[firstLesson].nextGoal = 'Restored next goal.';
// Interleave an edit immediately after the single base write. A cleanup loop
// must not delete a new-generation edit committed by the other tab.
let replacementInterleaved = false;
shared.afterSet = (key) => {
  if (key !== storageKey) return;
  shared.afterSet = null;
  replacementInterleaved = true;
  tabB.input('#workbook-practice2','An edit committed after the backup replacement write.');
};
await tabA.restore(replacement);
assert.equal(replacementInterleaved,true);
assert.match(tabA.one('#global-message').textContent,/Practice restored/);
tabB.input('#workbook-practice3','An older tab continues after replacement.');
sharedBackup = await tabA.exportState();
assert.equal(sharedBackup.lessons[firstLesson].notes,replacement.lessons[firstLesson].notes);
assert.equal(sharedBackup.lessons[firstLesson].nextGoal,replacement.lessons[firstLesson].nextGoal);
assert.equal(sharedBackup.lessons[firstLesson].practice2,'An edit committed after the backup replacement write.');
assert.equal(sharedBackup.lessons[firstLesson].practice3,'An older tab continues after replacement.');
assert.equal(sharedBackup.lessons[secondLesson].notes,replacement.lessons[secondLesson].notes);
const fullReload = createDocument(null,false,shared);
fullReload.navigate(firstLesson);
assert.equal(fullReload.one('#workbook-notes').value,replacement.lessons[firstLesson].notes);
assert.equal(fullReload.one('#workbook-practice2').value,'An edit committed after the backup replacement write.');
assert.equal(fullReload.one('#workbook-practice3').value,'An older tab continues after replacement.');
fullReload.navigate(zeroScenario.lessonId);
assert.equal(fullReload.one('[data-sim-number="' + zeroTask.id + '"]').value,'0');
assert.match(fullReload.one('#local-progress').textContent,/10\/10 scenarios passed/);
fullReload.window.close(); tabA.window.close(); tabB.window.close();

// Storage failure is visible and does not destroy the working export.
const noStorage = createDocument(null,true);
noStorage.input('#workbook-notes','Fictional practice stays available for export.');
assert.match(noStorage.one('#storage-notice').textContent,/unavailable or full/);
noStorage.one('#export-work').click();
assert.ok(noStorage.exported());
assert.equal(JSON.parse(await noStorage.exported().text()).lessons[firstLesson].notes,'Fictional practice stays available for export.');
noStorage.setStorageFails(false);
noStorage.input('#workbook-nextGoal','Storage recovered without losing session writing.');
assert.equal(noStorage.one('#storage-notice').textContent,'');
const recoveredReload = createDocument(null,false,noStorage.storage);
assert.equal(recoveredReload.one('#workbook-notes').value,'Fictional practice stays available for export.');
recoveredReload.window.close();
noStorage.window.close();
primary.window.close();
assert.deepEqual(requestedResources,[]);
assert.deepEqual(errors,[]);
console.log(JSON.stringify({
  document:source, runtime:'JSDOM (not a visual browser)', result:'passed',
  lessons:24,scenarios:10,simulationTasks:taskCount,sequenceTasks,knowledgeQuestions:questionCount,
  checks:['critical hold at 80%','correct retry','numeric zero','sequence order and focus','local saving','reload persistence',
    '24 lesson checks','JSON export and restore','legacy raw backup','forged score ignored','invalid backup preserves work','HTML text escaped',
    'alternating tabs across lessons','same-lesson separate fields','split scenario and knowledge responses','merged check attempts',
    'numeric-zero reload and deletion','cross-tab reset','atomic backup replacement with an older tab','merged export and full reload',
    'interleaved checks bound to evaluated scenario and knowledge answers',
    'storage-failure export and recovery','no network requests'],
},null,2));
