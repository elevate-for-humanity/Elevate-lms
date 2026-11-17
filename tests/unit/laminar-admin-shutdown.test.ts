import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {afterEach,describe,expect,it,vi} from 'vitest';

const server=readFileSync(resolve(process.cwd(),'apps/admin/server.js'),'utf8');
const source=server.slice(server.indexOf('async function gracefulShutdown('),server.indexOf('// Register signal handlers for graceful shutdown'));

function fixture(shutdown?: () => Promise<void>, delayedHttp=false){
 let drained: (()=>void)|undefined;
 const exit=vi.fn(),warn=vi.fn(),stopMonitoring=vi.fn();
 const sandbox:Record<string|symbol,any>={
  isShuttingDown:false,rejectionMetrics:{total:0,suppressed:0,unhandled:0},
  getMetrics:()=>({}),stopMonitoring,
  log:{info:vi.fn(),warn,error:vi.fn(),debug:vi.fn(),serverStop:vi.fn()},
  process:{uptime:()=>5,exit},setTimeout,clearTimeout,
  httpServer:{close:vi.fn((done:()=>void)=>{drained=done;if(!delayedHttp)done();})},
 };
 if(shutdown)sandbox[Symbol.for('elevate.laminar.tracing')]={shutdown};
 const run=runInNewContext(source+'\ngracefulShutdown;',sandbox) as (signal:string,exitCode?:number)=>Promise<void>;
 return {run,exit,warn,stopMonitoring,drain:()=>drained!()};
}

afterEach(()=>vi.useRealTimers());

describe('Admin Laminar shutdown drain',()=>{
 it('waits for HTTP drain and the existing tracing singleton before exiting',async()=>{
  vi.useFakeTimers();
  let flushed!:()=>void;
  const shutdown=vi.fn(()=>new Promise<void>(resolve=>{flushed=resolve;}));
  const server=fixture(shutdown,true);
  const stopping=server.run('SIGTERM',7);
  expect(shutdown).not.toHaveBeenCalled();expect(server.exit).not.toHaveBeenCalled();
  server.drain();await vi.advanceTimersByTimeAsync(0);
  expect(shutdown).toHaveBeenCalledTimes(1);expect(server.exit).not.toHaveBeenCalled();
  flushed();await stopping;
  expect(server.exit).toHaveBeenCalledExactlyOnceWith(7);
  expect(server.warn).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });

 it('bounds an unresponsive exporter to two seconds and clears its timer',async()=>{
  vi.useFakeTimers();
  const shutdown=vi.fn(()=>new Promise<void>(()=>{}));
  const server=fixture(shutdown);
  const stopping=server.run('SIGTERM');await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(1999);expect(server.exit).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);await stopping;
  expect(server.exit).toHaveBeenCalledExactlyOnceWith(0);
  expect(server.warn).toHaveBeenCalledExactlyOnceWith('Laminar shutdown incomplete; continuing server shutdown.');
  expect(vi.getTimerCount()).toBe(0);
 });

 it('fails open on exporter rejection without logging its raw error',async()=>{
  vi.useFakeTimers();
  const server=fixture(vi.fn(async()=>{throw new Error('private-key private-exporter-response');}));
  await server.run('SIGTERM');
  expect(server.exit).toHaveBeenCalledExactlyOnceWith(0);
  expect(server.warn).toHaveBeenCalledExactlyOnceWith('Laminar shutdown incomplete; continuing server shutdown.');
  expect(JSON.stringify(server.warn.mock.calls)).not.toContain('private-');
  expect(vi.getTimerCount()).toBe(0);
 });

 it('ignores duplicate signals while the first shutdown is draining',async()=>{
  vi.useFakeTimers();
  let flushed!:()=>void;
  const shutdown=vi.fn(()=>new Promise<void>(resolve=>{flushed=resolve;}));
  const server=fixture(shutdown);
  const stopping=server.run('SIGTERM');await vi.advanceTimersByTimeAsync(0);
  await server.run('SIGINT');expect(shutdown).toHaveBeenCalledTimes(1);
  expect(server.stopMonitoring).toHaveBeenCalledTimes(1);expect(server.exit).not.toHaveBeenCalled();
  flushed();await stopping;expect(server.exit).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
 });

 it('exits normally when tracing was never initialized',async()=>{
  vi.useFakeTimers();
  const server=fixture();await server.run('SIGTERM');
  expect(server.exit).toHaveBeenCalledExactlyOnceWith(0);
  expect(server.warn).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
});
