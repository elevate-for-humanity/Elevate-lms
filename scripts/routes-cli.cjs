#!/usr/bin/env node

/**
 * Routes CLI - Command-line tool for route management
 * Usage: node scripts/routes-cli.cjs [command]
 */

const routeValidator = require('../services/route-validator.cjs');

const commands = {
  check: {
    description: 'Check routing configuration for issues',
    action: () => {
      console.log('🔍 Checking routing configuration...\n');

      const { validation, reportPath } = routeValidator.run(false);

      console.log('📊 Validation Results:');
      console.log(`  Total Pages:    ${validation.totalPages}`);
      console.log(`  Total Imports:  ${validation.totalImports}`);
      console.log(`  Total Routes:   ${validation.totalRoutes}`);
      console.log(`  Issues Found:   ${validation.issues.length}\n`);

      if (validation.missingImports.length > 0) {
        console.log('⚠️  Missing Imports:');
        validation.missingImports.forEach((page) => {
          console.log(`  - ${page.name} (${page.file})`);
        });
        console.log('');
      }

      if (validation.missingRoutes.length > 0) {
        console.log('⚠️  Missing Routes:');
        validation.missingRoutes.forEach((page) => {
          console.log(`  - ${page.route} → ${page.name}`);
        });
        console.log('');
      }

      if (validation.unusedImports.length > 0) {
        console.log('⚠️  Unused Imports:');
        validation.unusedImports.forEach((imp) => {
          console.log(`  - ${imp.name} (${imp.path})`);
        });
        console.log('');
      }

      if (validation.issues.length === 0) {
        console.log('✅ All routes configured correctly!\n');
      } else {
        console.log(`❌ Found ${validation.issues.length} issues\n`);
        console.log(`Run 'npm run routes:fix' to auto-fix issues\n`);
      }

      console.log(`📄 Full report: ${reportPath}\n`);

      process.exit(validation.issues.length > 0 ? 1 : 0);
    },
  },

  fix: {
    description: 'Auto-fix routing issues',
    action: () => {
      console.log('🔧 Auto-fixing routing issues...\n');

      const { validation, fixResults, reportPath } = routeValidator.run(true);

      if (validation.issues.length === 0) {
        console.log('✅ No issues found, nothing to fix!\n');
        process.exit(0);
      }

      if (fixResults.success) {
        console.log('✅ Auto-fix completed:');
        console.log(`  Imports Added: ${fixResults.importsAdded}`);
        console.log(`  Routes Added:  ${fixResults.routesAdded}\n`);

        console.log('📝 Changes made to:');
        console.log('  - src/App.jsx (backed up)');
        console.log('  - routes.config.mjs (backed up)\n');

        console.log('⚠️  Please review the changes and test your application\n');
        console.log(`📄 Full report: ${reportPath}\n`);

        process.exit(0);
      } else {
        console.log(`❌ Auto-fix failed: ${fixResults.error}\n`);
        console.log('Manual intervention required\n');
        process.exit(1);
      }
    },
  },

  list: {
    description: 'List all pages and their routes',
    action: () => {
      console.log('📋 Listing all pages and routes...\n');

      const pages = routeValidator.scanPages();
      const { imports, routes } = routeValidator.parseAppFile();

      console.log(`Found ${pages.length} page components:\n`);

      pages.forEach((page) => {
        const hasImport = imports.some((imp) => imp.name === page.name);
        const hasRoute = routes.some(
          (route) => route.path === page.route && route.component === page.name,
        );

        const status = hasImport && hasRoute ? '✅' : hasImport ? '⚠️ ' : '❌';

        console.log(`${status} ${page.name}`);
        console.log(`   Route: ${page.route}`);
        console.log(`   File:  ${page.relativePath}`);
        console.log(`   Import: ${hasImport ? 'Yes' : 'No'}`);
        console.log(`   Routed: ${hasRoute ? 'Yes' : 'No'}`);
        console.log('');
      });
    },
  },

  scan: {
    description: 'Scan pages directory',
    action: () => {
      console.log('🔍 Scanning pages directory...\n');

      const pages = routeValidator.scanPages();

      console.log(`Found ${pages.length} page components:\n`);

      const byDirectory = {};
      pages.forEach((page) => {
        const dir = page.relativePath.includes('/') ? page.relativePath.split('/')[0] : 'root';

        if (!byDirectory[dir]) {
          byDirectory[dir] = [];
        }
        byDirectory[dir].push(page);
      });

      Object.keys(byDirectory)
        .sort()
        .forEach((dir) => {
          console.log(`📁 ${dir}/`);
          byDirectory[dir].forEach((page) => {
            console.log(`   - ${page.name} → ${page.route}`);
          });
          console.log('');
        });
    },
  },

  help: {
    description: 'Show help',
    action: () => {
      console.log('Routes CLI - Route management tool\n');
      console.log('Usage: npm run routes:[command]\n');
      console.log('Commands:');
      Object.keys(commands).forEach((cmd) => {
        console.log(`  ${cmd.padEnd(10)} ${commands[cmd].description}`);
      });
      console.log('');
    },
  },
};

// Parse command
const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command].action();
} else {
  console.error(`❌ Unknown command: ${command}\n`);
  commands.help.action();
  process.exit(1);
}
