/** Convert the interactive browser stream into a terminal governed-tool receipt. */
export async function browserToolResponse(response: Response): Promise<Response> {
  if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) return response;
  const reader = response.body?.getReader();
  if (!reader) return Response.json({ok:false,status:'failed',error:'Browser returned no execution stream'}, {status:502});
  const decoder = new TextDecoder();
  let pending = '', bytes = 0;
  let final: Record<string, unknown> | null = null;
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_048_576) throw new Error('Browser execution stream exceeded its limit');
      pending += decoder.decode(value, {stream:true});
      const lines = pending.split('\n'); pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6));
        if (['done','error','authentication_required','interaction_required'].includes(event.type)) final = event;
      }
    }
    if (final?.type === 'done' && final.ok === true && final.taskId && final.sessionId) {
      return Response.json({...final,status:'completed',verified:true});
    }
    return Response.json({ok:false,status:'blocked',taskId:final?.taskId,
      error:final?.error || final?.message || 'Browser ended without a terminal completion receipt'}, {status:409});
  } catch {
    await reader.cancel().catch(() => {});
    return Response.json({ok:false,status:'failed',error:'Browser execution stream could not be verified'}, {status:502});
  } finally { reader.releaseLock(); }
}
