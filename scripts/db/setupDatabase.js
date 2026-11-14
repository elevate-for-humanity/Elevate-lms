// scripts/db/setupDatabase.js
// Convenience script: run migrations, then seeds

const { runMigrations } = require('./runMigrations');
const { runSeeds } = require('./runSeeds');

async function setupDatabase() {
  await runMigrations();
  await runSeeds();
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
