#!/usr/bin/env node
// Main entry point for EFH production server (CJS)
// Also provides a default export for ESM test environments.
const app = require('./simple-server.cjs');
module.exports = app;
module.exports.default = app;
