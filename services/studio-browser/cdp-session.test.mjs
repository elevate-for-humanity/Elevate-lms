import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { cdpStatus } from './cdp-session.mjs';
import { runActions } from './server.mjs';

function fixture() {
  const calls = [], clients = [];
  const session = { page: new EventEmitter(), activeTabId: 'one', context: {
    newCDPSession: async page => {
      const client = new EventEmitter();
      client.send = async (method, params) => { calls.push({ page, method, params }); return {}; };
      client.detach = async () => { client.detached = true; };
      clients.push(client);
      return client;
    },
  } };
  return { session, calls, clients };
}

test('dashboard CDP input uses the current tab and reuses one attachment', async () => {
  const { session, calls, clients } = fixture();
  await Promise.all([cdpStatus(session), cdpStatus(session)]);
  await runActions(session, { type: 'type', transport: 'cdp', text: 'hello' });
  assert.equal(clients.length, 1);
  assert.equal(calls.at(-1).method, 'Input.insertText');
  assert.equal(calls.at(-1).params.text, 'hello');
  const original = session.page;
  session.page = new EventEmitter(); session.activeTabId = 'two';
  assert.equal((await cdpStatus(session)).tabId, 'two');
  await runActions(session, { type: 'click', transport: 'cdp', x: 20, y: 30 });
  assert.equal(clients.length, 2);
  assert.equal(calls.at(-1).page, session.page);
  assert.notEqual(calls.at(-1).page, original);
  original.emit('close');
  assert.equal(clients[0].detached, true);
});

test('CDP failure is reported without replay; next operation can reconnect', async () => {
  const { session, clients } = fixture();
  await cdpStatus(session);
  let attempts = 0;
  clients[0].send = async () => { attempts++; throw new Error('disconnected'); };
  await assert.rejects(runActions(session, {type:'type',transport:'cdp',text:'once'}), /disconnected/);
  assert.equal(attempts, 1);
  assert.equal(clients[0].detached, true);
  assert.equal((await cdpStatus(session)).connected, true);
  assert.equal(clients.length, 2);
});

test('CDP rejects invalid coordinates and dispatches a complete double click', async () => {
  const { session, calls } = fixture();
  await assert.rejects(runActions(session,{type:'click',transport:'cdp',x:'bad',y:3}), /coordinate/);
  assert.equal(calls.filter(c=>c.method.startsWith('Input.')).length,0);
  await runActions(session,{type:'double_click',transport:'cdp',x:12,y:24});
  assert.deepEqual(calls.filter(c=>c.params?.type==='mousePressed').map(c=>c.params.clickCount),[1,2]);
});

test('Playwright option remains available and CDP sessions are isolated', async () => {
  const a=fixture(), b=fixture(); let text;
  a.session.page.keyboard={insertText:async value=>{text=value;}};
  await runActions(a.session,{type:'type',transport:'playwright',text:'fallback'});
  assert.equal(text,'fallback'); assert.equal(a.clients.length,0);
  await cdpStatus(a.session); await cdpStatus(b.session);
  assert.notEqual(a.clients[0],b.clients[0]);
});
