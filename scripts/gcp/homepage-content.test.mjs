import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHomepageText} from './homepage-content.mjs';
test('finds the business heading across responsive spans and soft hyphens',()=>{
 const html='<h3>Business &amp; <span class="sm:hidden">Entrepre&shy;neurship</span><span class="hidden sm:inline">Entrepreneurship</span></h3>';
 assert.ok(normalizeHomepageText(html).includes('Business & Entrepreneurship'));
});
test('does not accept a missing heading from serialized script data',()=>{
 assert.equal(normalizeHomepageText('<script>Business & Entrepreneurship</script><h1>Training</h1>'),'Training');
});
test('decodes numeric ampersands and collapses content whitespace',()=>{
 assert.equal(normalizeHomepageText('<h3>Business &#38;\n Entrepreneurship</h3>'),'Business & Entrepreneurship');
});
