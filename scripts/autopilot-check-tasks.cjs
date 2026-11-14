#!/usr/bin/env node

/**
 * AUTOPILOT: CHECK AND EXECUTE PENDING TASKS
 *
 * This script:
 * 1. Checks .autopilot-tasks/ directory for pending tasks
 * 2. Executes tasks that are ready
 * 3. Updates task status
 *
 * Runs automatically via autopilot-master workflow every 15 minutes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🤖 AUTOPILOT: CHECKING PENDING TASKS');
console.log('=====================================\n');

const tasksDir = path.join(__dirname, '..', '.autopilot-tasks');

if (!fs.existsSync(tasksDir)) {
  console.log('📁 No .autopilot-tasks directory found');
  console.log('Creating directory...\n');
  fs.mkdirSync(tasksDir, { recursive: true });
}

// Read all task files
const taskFiles = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.json'));

if (taskFiles.length === 0) {
  console.log('✅ No pending tasks found');
  console.log('All autopilots are idle\n');
  process.exit(0);
}

console.log(`📋 Found ${taskFiles.length} task(s):\n`);

let tasksExecuted = 0;
let tasksFailed = 0;

taskFiles.forEach((taskFile) => {
  const taskPath = path.join(tasksDir, taskFile);
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));

  console.log(`📌 Task: ${task.task_id}`);
  console.log(`   Type: ${task.task_type}`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Priority: ${task.priority}`);

  // Check if task is ready to execute
  if (task.status === 'PENDING_TOKEN' && task.task_type === 'deployment') {
    console.log('   ⏳ Waiting for Cloudflare API token');
    console.log('   💡 Autopilot should provide token to:');
    console.log(`      ${task.required_action.script}`);
    console.log('');
    return;
  }

  if (task.status === 'PENDING' || task.status === 'READY') {
    console.log('   🚀 Executing task...\n');

    try {
      // Execute the task based on type
      if (task.task_type === 'deployment' && task.required_action.script) {
        const script = path.join(__dirname, '..', task.required_action.script);

        if (fs.existsSync(script)) {
          console.log(`   Running: ${task.required_action.script}`);

          // Check if we have the required token
          const envPath = path.join(__dirname, '..', '.env');
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const hasToken =
              envContent.includes('CLOUDFLARE_API_TOKEN=') &&
              !envContent.includes('CLOUDFLARE_API_TOKEN=your-token');

            if (hasToken) {
              const output = execSync(`node ${script}`, {
                cwd: path.join(__dirname, '..'),
                encoding: 'utf8',
                stdio: 'pipe',
              });

              console.log(output);

              // Update task status
              task.status = 'COMPLETED';
              task.completed_at = new Date().toISOString();
              fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));

              console.log('   ✅ Task completed successfully\n');
              tasksExecuted++;
            } else {
              console.log('   ⏳ Token not available yet\n');
            }
          } else {
            console.log('   ⚠️  .env file not found\n');
          }
        } else {
          console.log(`   ❌ Script not found: ${script}\n`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Task failed: ${error.message}\n`);

      // Update task status
      task.status = 'FAILED';
      task.error = error.message;
      task.failed_at = new Date().toISOString();
      fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));

      tasksFailed++;
    }
  } else {
    console.log(`   ℹ️  Status: ${task.status}\n`);
  }
});

console.log('=====================================');
console.log(`✅ Tasks executed: ${tasksExecuted}`);
console.log(`❌ Tasks failed: ${tasksFailed}`);
console.log(`⏳ Tasks pending: ${taskFiles.length - tasksExecuted - tasksFailed}`);
console.log('');

if (tasksExecuted > 0) {
  console.log('🎉 Autopilot completed tasks successfully!');
} else if (taskFiles.length > 0) {
  console.log('💡 Autopilot is waiting for required resources');
}

console.log('');
