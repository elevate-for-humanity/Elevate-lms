// CDP is scoped to the existing page/context; never expose a browser-wide socket.
const connections = new WeakMap();

export async function pageCdp(session) {
  const page = session.page;
  let pending = connections.get(page);
  if (!pending) {
    pending = session.context.newCDPSession(page).then(async (client) => {
      client.on('Inspector.detached', () => connections.delete(page));
      page.once('close', () => {
        connections.delete(page);
        void client.detach().catch(() => undefined);
      });
      try {
        await client.send('Page.getFrameTree');
        return { send: async (...args) => {
          try { return await client.send(...args); }
          catch (error) {
            connections.delete(page);
            await client.detach().catch(() => undefined);
            throw error; // Never replay input: it may already have taken effect.
          }
        } };
      } catch (error) {
        await client.detach().catch(() => undefined);
        throw error;
      }
    });
    connections.set(page, pending);
    pending.catch(() => { if (connections.get(page) === pending) connections.delete(page); });
  }
  return pending;
}

export async function cdpStatus(session) {
  const client = await pageCdp(session);
  await client.send('Page.getFrameTree');
  return { connected: true, protocol: 'CDP', scope: 'active-tab', tabId: session.activeTabId };
}

export async function runCdpInput(session, action) {
  if (!['type', 'click', 'pointer_click', 'double_click', 'move', 'scroll'].includes(action.type)) return false;
  const coordinate = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('Invalid CDP input coordinate');
    return number;
  };
  const client = await pageCdp(session);
  if (action.type === 'type') {
    await client.send('Input.insertText', { text: String(action.text || '').slice(0, 4000) });
    return true;
  }
  const x = coordinate(action.x ?? 0), y = coordinate(action.y ?? 0);
  if (action.type === 'scroll') {
    await client.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y,
      deltaX: coordinate(action.deltaX ?? action.scroll_x ?? 0),
      deltaY: coordinate(action.deltaY ?? action.scroll_y ?? 0) });
  } else if (action.type === 'move') {
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  } else {
    const button = ['left', 'right', 'middle'].includes(action.button) ? action.button : 'left';
    const clicks = action.type === 'double_click' || Number(action.clickCount) === 2 ? 2 : 1;
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (let clickCount = 1; clickCount <= clicks; clickCount++) {
      await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount });
      await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount });
    }
  }
  return true;
}
