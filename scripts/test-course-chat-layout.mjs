import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const css = readFileSync(new URL('../components/studio/UnifiedEllieChat.module.css', import.meta.url), 'utf8');
const builder = readFileSync(new URL('../components/admin/course-builder/UnifiedCourseBuilder.tsx', import.meta.url), 'utf8');
const chat = readFileSync(new URL('../components/studio/UnifiedEllieChat.tsx', import.meta.url), 'utf8');
assert.match(builder, /<UnifiedEllieChat embedded contentSized\b/);
assert.doesNotMatch(builder, /h-\[min\(24rem,45dvh\)\]/);
assert.match(chat, /embedded && contentSized \? styles\.contentSized/);
assert.match(chat, /styles\.messagesViewport/);

// Exercise the production CSS with the same flex children as the page-flow embed.
// No application login, AI invocation, or production data mutation is required.
function fixture({ legacy = false, expanded = false, resized = false }) {
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>*{box-sizing:border-box}html{font-size:16px}body{margin:0;padding:12px;font-family:system-ui}' +
    '#panel{width:100%;overflow:hidden;border:1px solid #999;border-radius:12px}' +
    '.root{display:flex;height:100%;min-height:0;min-width:0;flex-direction:column;overflow:hidden}' +
    '.toolbar{flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid #ddd}' +
    'select,button{font:inherit;min-height:36px;max-width:100%}.shortcut{min-height:44px}' +
    '.messagesViewport{min-height:0;min-width:0;flex:1;overflow-x:hidden;overflow-y:auto;padding:20px 12px}' +
    '.composerShell{min-width:0;flex-shrink:0;padding:8px;border-top:1px solid #ddd}' +
    '.composerRow{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;border:1px solid #ccc;border-radius:16px;padding:8px}' +
    '.composer{order:-1;width:100%;flex-basis:100%;resize:vertical;padding:8px 12px;font:inherit;line-height:1.5}' +
    '.composerRow button{height:44px;flex-shrink:0}#send{margin-left:auto}' +
    '.notice{flex-shrink:0;padding:12px;min-height:64px;background:#fff8df}.activity{height:110px;flex-shrink:0;overflow-y:auto}' +
    css + (legacy ? '#panel{height:192px}' : '') + '</style></head><body>' +
    '<h1>Course controls</h1><div id="panel"><div class="root ' + (legacy ? '' : 'contentSized') + '">' +
    (expanded ? '<div class="notice">Private inference status and actionable recovery information can wrap across multiple lines.</div>' : '') +
    '<div class="toolbar"><select aria-label="Provider"><option>Automatic inference provider</option></select><button>Activity</button></div>' +
    '<nav class="toolbar"><button class="shortcut">Build course</button><button class="shortcut">Edit lesson</button><button class="shortcut">Check work</button></nav>' +
    (expanded ? '<div class="activity">Saved execution evidence<br>and persisted task progress</div><div class="notice">Review this plan before continuing.</div>' : '') +
    '<div class="messagesViewport" aria-label="Conversation">' + '<p>Saved conversation message</p>'.repeat(30) + '</div>' +
    '<div class="composerShell"><div class="composerRow"><textarea class="composer" aria-label="Instructions"' +
      (resized ? ' style="height:240px"' : '') + '>Test instructions</textarea>' +
    '<button>Files</button><button>Camera</button><button>Talk</button><button>Voice on</button><button id="send">Send</button></div>' +
    '<p>Governed actions are written to the audit trail.</p></div></div></div>' +
    '<script>document.getElementById("send").addEventListener("click",()=>document.body.dataset.clicked="yes")</script></body></html>';
}
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width:740, height:360 } });
  await page.setContent(fixture({legacy:true}));
  const baseline = await page.evaluate(() => ({
    send: document.getElementById('send').getBoundingClientRect().bottom,
    panel: document.getElementById('panel').getBoundingClientRect().bottom,
  }));
  assert.ok(baseline.send > baseline.panel, 'Legacy fixture must reproduce the clipped Send control');
  let cases = 0;
  for (const viewport of [{width:740,height:360},{width:844,height:390},{width:390,height:844},{width:320,height:568},{width:1280,height:720}]) {
    await page.setViewportSize(viewport);
    for (const expanded of [false,true]) for (const resized of [false,true]) {
      await page.setContent(fixture({expanded,resized}));
      const geometry = await page.evaluate(() => {
        const panel = document.getElementById('panel');
        const root = panel.firstElementChild;
        const send = document.getElementById('send').getBoundingClientRect();
        const messages = document.querySelector('.messagesViewport');
        const messageBox = messages.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        return { sendTop:send.top,sendBottom:send.bottom,panelTop:bounds.top,panelBottom:bounds.bottom,
          messageHeight:messageBox.height, messageCanScroll:messages.scrollHeight>messages.clientHeight,
          rootClips:root.scrollHeight>root.clientHeight+1, panelClips:panel.scrollHeight>panel.clientHeight+1,
          pageWidth:document.documentElement.scrollWidth, viewportWidth:innerWidth };
      });
      assert.ok(geometry.sendTop >= geometry.panelTop && geometry.sendBottom <= geometry.panelBottom,
        JSON.stringify({viewport,expanded,resized,geometry}));
      assert.ok(geometry.messageHeight >= 128 && geometry.messageHeight <= 320, 'Conversation keeps a usable bounded viewport');
      assert.equal(geometry.messageCanScroll,true);
      assert.equal(geometry.rootClips,false);
      assert.equal(geometry.panelClips,false);
      assert.ok(geometry.pageWidth<=geometry.viewportWidth, 'No horizontal page overflow');
      await page.locator('#send').click();
      assert.equal(await page.locator('body').getAttribute('data-clicked'),'yes');
      cases++;
    }
  }
  console.log(JSON.stringify({courseChatLayoutCases:cases,landscapeRegressionReproduced:true,
    sendInsidePanel:true,messageViewportUsable:true,authenticatedCourseAcceptance:'NOT_RUN'}));
} finally { await browser.close(); }
