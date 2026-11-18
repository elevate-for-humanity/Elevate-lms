import {describe, expect, it} from 'vitest';
import {recoverRepeatedDirectoryInspection} from '../../lib/devstudio/paris-inspection-budget.mjs';

const allow = (path: string) => path.startsWith('apps/marketing/');
const repeat = ['search:marketing program', 'search:marketing program'];

describe('PARIS truncated-tree directory recovery', () => {
  it('lists the authenticated parent of an exhausted relevant file without resetting read history', () => {
    const history = [...repeat, 'read:apps/marketing/lib/programs.ts',
      'read:apps/marketing/lib/programs.ts'];
    const tree = [{type:'blob',path:'apps/marketing/lib/programs.ts'},
      {type:'blob',path:'tests/unit/programs.test.ts'}];
    expect(recoverRepeatedDirectoryInspection(history,
      {type:'search',query:'marketing program'}, tree, 'marketing program', allow))
      .toEqual({type:'list',path:'apps/marketing/lib'});
    expect(history).toHaveLength(4);
  });

  it('only permits one authenticated, not-yet-inspected directory', () => {
    const tree = [{type:'blob',path:'apps/marketing/lib/programs.ts'}];
    expect(recoverRepeatedDirectoryInspection(
      [...repeat,'list:apps/marketing/lib','list:apps/marketing/lib'],
      {type:'search',query:'marketing program'},tree,'marketing program',allow)).toBeNull();
  });

  it('never invents a directory from the task or a rejected file path', () => {
    const tree = [{type:'blob',path:'tests/unit/host-shop.test.ts'}];
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},tree,'apps/marketing/private',allow)).toBeNull();
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},[], 'marketing program',allow)).toBeNull();
  });

  it('can list a relevant authenticated directory even when no eligible file was returned', () => {
    const tree = [{type:'tree',path:'apps/marketing/host-shops'},
      {type:'tree',path:'lib/devstudio'}, {type:'tree',path:'apps/admin/internal'}];
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},tree,
      'Investigate marketing host shops search', allow))
      .toEqual({type:'list',path:'apps/marketing/host-shops'});
  });

  it('rejects privileged trees and does not redirect a fresh inspection', () => {
    const tree = [{type:'tree',path:'lib/devstudio/paris'},
      {type:'tree',path:'apps/marketing/../private'}];
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},tree,'paris private',allow)).toBeNull();
    expect(recoverRepeatedDirectoryInspection([],
      {type:'search',query:'marketing program'},
      [{type:'blob',path:'apps/marketing/lib/programs.ts'}], 'marketing program',allow)).toBeNull();
  });
  it('finds a still-uninspected ranked directory after twelve exhausted matches', () => {
    const dirs = Array.from({length:13}, (_, i) =>
      `apps/marketing/host-shops-${String(i).padStart(2, '0')}`);
    const history = [...repeat, ...dirs.slice(0, 12).map(path => `list:${path}`)];
    const tree = dirs.map(path => ({type:'tree', path}));
    expect(recoverRepeatedDirectoryInspection(history,
      {type:'search', query:'marketing program'}, tree,
      'marketing host shops', allow)).toEqual({type:'list', path:dirs[12]});
    expect(history).toHaveLength(14);
  });

  it('ranks only authorized, new blob parents instead of capping exhausted files', () => {
    const dirs = Array.from({length:13}, (_, i) =>
      `apps/marketing/host-shops-${String(i).padStart(2, '0')}`);
    const history = [...repeat, ...dirs.slice(0, 12).map(path => `list:${path}`)];
    const tree = dirs.map(path => ({type:'blob', path:`${path}/catalog.ts`}));
    expect(recoverRepeatedDirectoryInspection(history,
      {type:'search', query:'marketing program'}, tree,
      'marketing host shops catalog', allow)).toEqual({type:'list', path:dirs[12]});
  });

  it('cannot let forbidden tree directories occupy the twelve-directory cap', () => {
    const denied = Array.from({length:12}, (_, i) =>
      ({type:'tree', path:`apps/admin/marketing-host-shops-${String(i).padStart(2,'0')}`}));
    const permitted = 'apps/marketing/host-shops-99';
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search', query:'marketing program'},
      [...denied, {type:'tree',path:permitted}],
      'marketing host shops', allow)).toEqual({type:'list',path:permitted});
  });

  it('recovers a trusted Next.js dynamic route directory from tree entries', () => {
    const route = 'apps/marketing/app/programs/[program]/discussions';
    const history = [...repeat];
    expect(recoverRepeatedDirectoryInspection(history,
      {type:'search',query:'marketing program'}, [{type:'tree',path:route}],
      'Fix marketing discussions route', allow))
      .toEqual({type:'list',path:route});
    expect(history).toEqual(repeat);
  });

  it('recovers parenthesized Next.js route groups and dynamic-route blob parents', () => {
    const route = 'apps/marketing/app/(training)/programs/[program]';
    const tree = [{type:'blob',path:route + '/page.tsx'}];
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'}, tree,
      'Fix marketing training program page', allow))
      .toEqual({type:'list',path:route});
  });

  it('keeps authorization and traversal guards for dynamic routes', () => {
    const denied = 'apps/marketing/app/(private)/[student]/records';
    const forbidden = (path: string) => allow(path) && !path.includes('(private)');
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},
      [{type:'tree',path:denied}], 'marketing private student', forbidden)).toBeNull();
    expect(recoverRepeatedDirectoryInspection(repeat,
      {type:'search',query:'marketing program'},
      [{type:'tree',path:'apps/marketing/app/[program]/../private'}],
      'marketing private program', allow)).toBeNull();
  });


});
