#!/usr/bin/env node

/**
 * Site Diagnostic Tool
 * Fetches and analyzes the deployed site
 */

const SITE_URL = 'https://www.elevateforhumanity.org';

async function diagnose() {

  // Test 1: Homepage
  try {
    const response = await fetch(SITE_URL);

    const html = await response.text();
      `   Has <div id="root">: ${html.includes('id="root"') ? '✅' : '❌'}`
    );
      `   Has script tags: ${html.includes('<script') ? '✅' : '❌'}`
    );

    // Check for common issues
    const hasDoctype = html.toLowerCase().includes('<!doctype html>');
    const hasTitle = html.includes('<title>');
    const hasRoot = html.includes('id="root"');
    const hasScripts = html.match(/<script[^>]*src="[^"]*"/g);


    if (hasScripts && hasScripts.length > 0) {
    }

    // Check if it's actually blank (no content in root)
    const rootContent = html.match(/<div id="root">(.*?)<\/div>/s);
    if (rootContent) {
      const content = rootContent[1].trim();
        `   Root content: ${content.length > 0 ? content.substring(0, 50) + '...' : 'EMPTY (SPA will hydrate)'}`
      );
    }
  } catch (error) {
  }


  // Test 2: Main JS Bundle
  try {
    const htmlResponse = await fetch(SITE_URL);
    const html = await htmlResponse.text();
    const scriptMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);

    if (scriptMatch) {
      const bundleUrl = SITE_URL + scriptMatch[1];

      const bundleResponse = await fetch(bundleUrl);
        `   Status: ${bundleResponse.status} ${bundleResponse.statusText}`
      );
        `   Content-Type: ${bundleResponse.headers.get('content-type')}`
      );

      const bundle = await bundleResponse.text();

      // Check for common issues in bundle
      const hasReact = bundle.includes('react');
      const hasReactDOM = bundle.includes('react-dom');
      const hasRouter = bundle.includes('react-router');

    } else {
    }
  } catch (error) {
  }


  // Test 3: API Endpoints
  const endpoints = ['/sitemap.xml', '/robots.txt', '/_redirects'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(SITE_URL + endpoint);
    } catch (error) {
    }
  }


  // Test 4: Check for blank page indicators
  try {
    const response = await fetch(SITE_URL);
    const html = await response.text();

    // Remove all whitespace and check if root is truly empty
    const cleanHtml = html.replace(/\s+/g, '');
    const rootMatch = cleanHtml.match(/<divid="root">(.*?)<\/div>/);

    if (rootMatch) {
      const rootContent = rootMatch[1];
      if (rootContent.length === 0) {
      } else {
      }
    }

    // Check for error messages in HTML
    const hasError =
      html.toLowerCase().includes('error') ||
      html.toLowerCase().includes('failed') ||
      html.toLowerCase().includes('crash');

    if (hasError) {
    } else {
    }
  } catch (error) {
  }

}

diagnose().catch(console.error);
