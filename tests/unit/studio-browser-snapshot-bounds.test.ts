// @vitest-environment node
import {it as test} from 'vitest';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readBrowserSnapshot} from '@/services/studio-browser/cdp-snapshot.mjs';
function fixture(html, now=()=>0) {
 const dom=new JSDOM(html,{url:'https://admin.elevateforhumanity.org/studio/health'});
 dom.window.Element.prototype.getBoundingClientRect=function(){return {width:this.closest('[hidden]')?0:100,height:20};};
 const inspect=()=>new Function('document','window','Node','NodeFilter','performance',`return (${readBrowserSnapshot.toString()})(10)`)(dom.window.document,dom.window,dom.window.Node,dom.window.NodeFilter,{now});
 return {dom,inspect};
}
test('captures bounded controls, headings and open shadow roots without returning password values',()=>{
 const f=fixture('<h1>Studio</h1><button>Refresh</button><input type="password" value="private-fixture"><div id="host"></div>');
 f.dom.window.document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<button>Shadow action</button>';
 const result=f.inspect();assert.equal(result.headings[0].text,'Studio');assert.equal(result.controls[0].ref,'e11');
 assert.ok(result.controls.some(control=>control.name==='Shadow action'));
 assert.equal(JSON.stringify(result).includes('private-fixture'),false);f.dom.window.close();
});
test('a huge dashboard is explicitly truncated instead of scanning every control before its cap',()=>{
 const f=fixture('<h1>Large dashboard</h1>'+Array.from({length:10000},(_,i)=>`<button>Action ${i}</button>`).join(''));
 let reads=0;const read=f.dom.window.getComputedStyle.bind(f.dom.window);f.dom.window.getComputedStyle=element=>{reads++;return read(element);};
 const result=f.inspect();assert.equal(result.truncated,true);assert.equal(result.controls.length,80);assert.ok(reads<6000);f.dom.window.close();
});
test('the in-page time budget stops inspection and explicitly reports partial evidence',()=>{
 let time=0;const f=fixture('<h1>Slow layout</h1>'+'<button>Action</button>'.repeat(100),()=>time+=20);
 const result=f.inspect();assert.equal(result.truncated,true);assert.ok(result.controls.length<80);f.dom.window.close();
});
