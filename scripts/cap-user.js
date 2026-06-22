#!/usr/bin/env node
/**
 * Temporarily swaps capacitor.config.ts with capacitor.user.config.ts,
 * runs the given cap command, then restores the original config.
 *
 * Usage:
 *   node scripts/cap-user.js add android
 *   node scripts/cap-user.js sync android
 *   node scripts/cap-user.js open android
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const mainConfig = path.join(root, 'capacitor.config.ts');
const userConfig = path.join(root, 'capacitor.user.config.ts');
const backupConfig = path.join(root, 'capacitor.config.ts.bak');

const action = process.argv[2] || 'sync';
const platform = process.argv[3] || 'android';

if (!fs.existsSync(userConfig)) {
  console.error('capacitor.user.config.ts not found');
  process.exit(1);
}

// Backup original config
const originalContent = fs.readFileSync(mainConfig, 'utf8');
fs.writeFileSync(backupConfig, originalContent);
console.log('Backed up capacitor.config.ts');

try {
  // Swap in user config
  const userContent = fs.readFileSync(userConfig, 'utf8');
  fs.writeFileSync(mainConfig, userContent);
  console.log('Swapped to user config');

  // Run cap command
  const cmd = `npx cap ${action} ${platform}`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });

  console.log('Command completed successfully');
} catch (err) {
  console.error('Command failed:', err.message);
} finally {
  // Restore original config
  fs.writeFileSync(mainConfig, originalContent);
  if (fs.existsSync(backupConfig)) fs.unlinkSync(backupConfig);
  console.log('Restored original capacitor.config.ts');
}
