import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
import { launchBrowser } from './cdp-browser.mjs';

const executablePath = process.env.STUDIO_BROWSER_EXECUTABLE_PATH;
const listen = (server) => new Promise((resolve) => server.listen(0, '0.0.0.0', resolve));
const closeServer = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  });

test(
  'direct CDP browser service with real Chromium and local fixtures',
  {
    skip: executablePath ? false : 'Set STUDIO_BROWSER_EXECUTABLE_PATH to run real Chromium',
    timeout: 120000,
  },
  async (t) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cdp-integration-'));
    let origin, crossOrigin;
    const server = http.createServer((req, res) => {
      if (req.url === '/api/session') {
      if (req.method === 'POST') res.setHeader('Set-Cookie', 'api-session=fixture-http-only; HttpOnly; Path=/; SameSite=Lax');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ cookie: req.headers.cookie || '', method: req.method })); return;
    }
    if (req.url === '/download') {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="fixture.txt"',
        });
        res.end('download bytes');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      if (req.url === '/slow') {
        setTimeout(() => res.end('<!doctype html><h1>New delayed document</h1>'), 250);
        return;
      }
      if (req.url === '/frame') {
        res.end(
          '<!doctype html><label>Frame input<input id="frame-input" onmousedown="this.dataset.clicked=String(event.isTrusted)"></label><p>Frame visible</p>',
        );
        return;
      }
      if (req.url === '/popup') {
        res.end('<!doctype html><h1>Popup document</h1>');
        return;
      }
      res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>input,button,select,a{margin:8px;display:block}iframe{display:block;width:300px;height:100px}</style><h1>Old document</h1><div id="shadow-host"></div>
      <label>Name<input id="text"></label><label>Password<input id="password" type="password"></label>
      <label><input id="check" type="checkbox">Agree</label><select id="select"><option value="a">Alpha</option><option value="b">Beta</option></select>
      <button id="popup" onclick="window.open('/popup','_blank')">Open popup</button><input id="file" type="file">
      <button id="dialog" onclick="window.dialogResult=confirm('Confirm fixture')">Dialog</button>
      <a id="download" href="/download">Download</a><button id="blob" onclick="const a=document.createElement('a');a.href=window.URL.createObjectURL(new Blob(['blob bytes'],{type:'text/plain'}));a.download='blob.txt';a.click()">Blob</button>
      <iframe id="same" src="${origin}/frame"></iframe><iframe id="cross" src="${crossOrigin}/frame"></iframe>
      <script>const shadow=document.querySelector('#shadow-host').attachShadow({mode:'open'});shadow.innerHTML='<button id="shadow-button">Shadow action</button><input id="shadow-input" aria-label="Shadow input"><div id="nested-host"></div>';shadow.querySelector('button').addEventListener('click',event=>window.shadowClicked=event.isTrusted);shadow.querySelector('input').addEventListener('input',event=>window.shadowInput={value:event.target.value,trusted:event.isTrusted});shadow.querySelector('#nested-host').attachShadow({mode:'open'}).innerHTML='<button>Nested shadow action</button>';window.inputEvents=[];document.querySelector('#text').addEventListener('input',event=>{window.inputEvents.push({value:event.target.value,trusted:event.isTrusted});});</script>`);
    });
    await listen(server);
    origin = `http://127.0.0.1:${server.address().port}`;
    crossOrigin = `http://localhost:${server.address().port}`;
    let browser;
    t.after(async () => {
      await browser?.close();
      await closeServer(server);
      await fs.rm(directory, { recursive: true, force: true });
    });
    browser = await launchBrowser({ executablePath, headless: true, args: ['--no-sandbox'] });
    const runtimeErrors = [];
    browser.on('runtimeerror', (error) => runtimeErrors.push(error.message));
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', (error) => t.diagnostic(error.message));
    await page.goto(origin);

    await t.test('navigation waits for the new delayed document', async () => {
      await page.goto(origin + '/slow');
      assert.equal(
        await page.evaluate(() => document.querySelector('h1').textContent),
        'New delayed document',
      );
      await page.goto(origin);
    });
    await t.test('trusted input, password, checkbox, select and scoped locators', async () => {
      await page.locator('#text').fill('before');
      await page.locator('#text').fill('learner@example.com');
      assert.equal(await page.locator('#text').inputValue(), 'learner@example.com');
      const events = await page.evaluate(() => window.inputEvents);
      assert.equal(events.at(-1).value, 'learner@example.com');
      assert.ok(events.every((event) => event.trusted));
      await page.locator('#password').fill('test-password');
      assert.equal(await page.locator('#password').inputValue(), 'test-password');
      await page.locator('#check').check();
      assert.equal(await page.locator('#check').evaluate((el) => el.checked), true);
      assert.deepEqual(await page.locator('#select').selectOption('b'), ['b']);
      assert.equal(await page.getByRole('button', { name: 'Open popup', exact: true }).count(), 1);
    });
    await t.test('open shadow-root controls support scoped queries, trusted clicks and keyboard fill', async () => {
    const host = page.locator('#shadow-host');
    await host.getByRole('button', { name: 'Shadow action', exact: true }).click();
    assert.equal(await page.evaluate(() => window.shadowClicked), true);
    const input = host.locator('#shadow-input');
    await input.click();
    await input.fill('shadow@example.com');
    assert.equal(await input.inputValue(), 'shadow@example.com');
    assert.deepEqual(await page.evaluate(() => window.shadowInput), { value: 'shadow@example.com', trusted: true });
    assert.equal(await host.getByRole('button', { name: 'Nested shadow action', exact: true }).count(), 1);
    await host.getByRole('button', { name: 'Nested shadow action', exact: true }).click();
  });
  await t.test('same-origin and cross-site iframe documents receive real input', async () => {
      for (const selector of ['#same', '#cross']) {
        const input = page.frameLocator(selector).locator('input');
        await input.waitFor();
        await input.click();
        assert.equal(await input.getAttribute('data-clicked'), 'true');
        await input.fill(selector + ' input');
        assert.equal(await input.inputValue(), selector + ' input');
        const frame = await page.resolveFrame(selector);
        assert.equal(
          await frame.evaluate(() => document.querySelector('p').textContent),
          'Frame visible',
        );
      }
    });
    await t.test('popup attachment and independent tabs', async () => {
      const opened = page.waitForEvent('popup', { timeout: 5000 });
      await page.locator('#popup').click();
      const popup = await opened;
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(
        await popup.evaluate(() => document.querySelector('h1').textContent),
        'Popup document',
      );
      assert.equal(context.pages().length, 2);
      await popup.close();
    });
    await t.test('mobile viewport screenshot has exact PNG dimensions', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      const png = await page.screenshot();
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), 390);
      assert.equal(png.readUInt32BE(20), 844);
      await page.setViewportSize({ width: 1280, height: 720 });
    });
    await t.test('file chooser transfers a real local file', async () => {
      const filename = path.join(directory, 'upload.txt');
      await fs.writeFile(filename, 'upload bytes');
      const chooserPromise = page.waitForEvent('filechooser', { timeout: 5000 });
      await page.locator('#file').click();
      const chooser = await chooserPromise;
      await chooser.setFiles([filename]);
      assert.equal(
        await page.locator('#file').evaluate(async (el) => el.files[0].text()),
        'upload bytes',
      );
    });
    await t.test('dialog acceptance resumes the page', async () => {
      const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
      const clicked = page.locator('#dialog').click();
      const dialog = await dialogPromise;
      assert.equal(dialog.message(), 'Confirm fixture');
      await dialog.accept();
      await clicked;
      assert.equal(await page.evaluate(() => window.dialogResult), true);
    });
    await t.test('HTTP and blob downloads produce exact bytes', async () => {
      for (const [selector, expected] of [
        ['#download', 'download bytes'],
        ['#blob', 'blob bytes'],
      ]) {
        const downloaded = page.waitForEvent('download', { timeout: 5000 });
        await page.locator(selector).click();
        const download = await downloaded.catch((error) => {
          throw new Error(`${selector}: ${error.message}`, { cause: error });
        });
        const destination = path.join(directory, download.suggestedFilename());
        await download.saveAs(destination);
        assert.equal(await fs.readFile(destination, 'utf8'), expected);
      }
    });
    await t.test(
      'cookies, localStorage and IndexedDB restore while contexts stay isolated',
      async () => {
        await page.evaluate(async () => {
          document.cookie = 'fixture=stored; path=/';
          localStorage.setItem('fixture', 'local-value');
          await new Promise((resolve, reject) => {
            const request = indexedDB.open('fixture-db', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('items');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('items', 'readwrite');
              tx.objectStore('items').put({ value: 'indexed-value' }, 'key');
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => reject(tx.error);
            };
          });
        });
        const state = await context.storageState({ indexedDB: true });
        const isolated = await browser.newContext();
        const isolatedPage = await isolated.newPage();
        await isolatedPage.goto(origin);
        assert.equal(await isolatedPage.evaluate(() => document.cookie), '');
        assert.equal(await isolatedPage.evaluate(() => localStorage.getItem('fixture')), null);
        await isolated.close();
        const restored = await browser.newContext({ storageState: state });
        const restoredPage = await restored.newPage();
        await restoredPage.goto(origin);
        assert.match(await restoredPage.evaluate(() => document.cookie), /fixture=stored/);
        assert.equal(
          await restoredPage.evaluate(() => localStorage.getItem('fixture')),
          'local-value',
        );
        const value = await restoredPage.evaluate(
          () =>
            new Promise((resolve, reject) => {
              const request = indexedDB.open('fixture-db');
              request.onerror = () => reject(request.error);
              request.onsuccess = () => {
                const db = request.result;
                const result = db.transaction('items').objectStore('items').get('key');
                result.onsuccess = () => {
                  resolve(result.result);
                  db.close();
                };
                result.onerror = () => reject(result.error);
              };
            }),
        );
        assert.deepEqual(value, { value: 'indexed-value' });
        await restored.close();
      },
    );
    await t.test('context requests share HttpOnly cookies with browser without leaking across hosts', async () => {
    const apiContext = await browser.newContext();
    try {
      const login = await apiContext.request.post(origin + '/api/session', { data: { fixture: true } });
      assert.equal(login.status(), 200);
      assert.equal((await login.json()).method, 'POST');
      const request = await apiContext.request.get(origin + '/api/session');
      assert.equal((await request.json()).cookie, 'api-session=fixture-http-only');
      const apiPage = await apiContext.newPage();
      await apiPage.goto(origin + '/api/session');
      assert.equal(await apiPage.evaluate(() => JSON.parse(document.body.textContent).cookie), 'api-session=fixture-http-only');
      assert.equal(await apiPage.evaluate(() => document.cookie), '');
      const crossHost = await apiContext.request.get(crossOrigin + '/api/session');
      assert.equal((await crossHost.json()).cookie, '');
    } finally { await apiContext.close(); }
  });
  await t.test('tracing writes a valid ZIP with explicitly named CDP evidence format', async () => {
    const destination = path.join(directory, 'evidence.zip');
    await context.tracing.start();
    await page.goto(origin + '/slow');
    await context.tracing.stop({ path: destination });
    const archive = await fs.readFile(destination);
    assert.equal(archive.subarray(0, 2).toString(), 'PK');
    const { stdout: filenames } = await execFileAsync('unzip', ['-Z1', destination]);
    assert.deepEqual(filenames.trim().split('\n'), ['cdp-evidence.json']);
    const { stdout: data } = await execFileAsync('unzip', ['-p', destination, 'cdp-evidence.json']);
    const evidence = JSON.parse(data);
    assert.equal(evidence.format, 'studio-cdp-evidence-v1');
    assert.ok(Number.isFinite(evidence.startedAt));
    assert.ok(evidence.events.some(event => event.method === 'Page.frameNavigated'));
  });
  assert.deepEqual(runtimeErrors, []);
  },
);
