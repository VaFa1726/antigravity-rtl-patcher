const asar = require('@electron/asar');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ora = require('ora');
const chalk = require('chalk');
const { findInstallations } = require('./paths');
const { checkPermissions, delay } = require('./utils');

const PATCH_MARKER = '__AGY_RTL_INJECTED__';
const BACKUP_SUFFIX = '.agy-rtl-backup';
const PRELOAD_FILENAME = 'preload.js';

/**
 * Find preload.js inside an extracted ASAR directory.
 * Searches common locations and falls back to recursive search.
 */
function findPreloadJs(extractDir) {
  // Common locations
  const candidates = [
    path.join(extractDir, 'dist', PRELOAD_FILENAME),
    path.join(extractDir, PRELOAD_FILENAME),
    path.join(extractDir, 'out', PRELOAD_FILENAME),
    path.join(extractDir, 'app', PRELOAD_FILENAME),
    path.join(extractDir, 'src', PRELOAD_FILENAME),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Recursive fallback — find any preload.js (skip node_modules)
  function searchDir(dir, depth) {
    if (depth > 5) return null;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === PRELOAD_FILENAME) return full;
        if (entry.isDirectory()) {
          const found = searchDir(full, depth + 1);
          if (found) return found;
        }
      }
    } catch (e) { /* ignore permission errors */ }
    return null;
  }

  return searchDir(extractDir, 0);
}

/**
 * Patch an ASAR-packed Antigravity installation.
 * Extracts the ASAR, injects RTL engine into preload.js, and repacks.
 */
async function patchAsar(installation, spinner) {
  const { asarPath } = installation;
  const backupPath = asarPath + BACKUP_SUFFIX;
  const tmpDir = path.join(os.tmpdir(), 'agy-rtl-patch-' + Date.now());

  try {
    // 1. Backup
    if (!fs.existsSync(backupPath)) {
      spinner.start('Creating backup...');
      await fs.copy(asarPath, backupPath);
      spinner.succeed('Backup created.');
    } else {
      spinner.info('Backup already exists, skipping.');
    }

    // 2. Extract
    spinner.start('Extracting app.asar...');
    await fs.ensureDir(tmpDir);
    asar.extractAll(asarPath, tmpDir);
    spinner.succeed('Extracted successfully.');

    // 2.5 Check if it's the IDE
    const pkgJsonPath = path.join(tmpDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
        if (pkg.name && (pkg.name.toLowerCase().includes('ide') || pkg.name.toLowerCase().includes('antigravity-ide'))) {
          spinner.warn('Antigravity IDE detected. Skipping (this patcher is only for the main app).');
          await fs.remove(tmpDir);
          return;
        }
      } catch (e) {}
    }

    // 3. Find preload.js
    spinner.start('Searching for preload.js...');
    const preloadPath = findPreloadJs(tmpDir);

    if (!preloadPath) {
      spinner.warn('No preload.js found in this package. Skipping.');
      await fs.remove(tmpDir);
      return;
    }

    spinner.succeed('Found: ' + chalk.gray(path.relative(tmpDir, preloadPath)));

    // 4. Check if already patched
    const preloadContent = await fs.readFile(preloadPath, 'utf-8');
    if (preloadContent.includes(PATCH_MARKER)) {
      spinner.info('Already patched. Use "restore" first to re-patch.');
      await fs.remove(tmpDir);
      return;
    }

    // 5. Read injection payload
    spinner.start('Injecting RTL engine into preload...');
    const payloadPath = path.join(__dirname, '..', 'payload', 'preload-inject.js');
    const payload = await fs.readFile(payloadPath, 'utf-8');

    // 6. Append payload to preload.js
    const injected = preloadContent + '\n\n// ' + PATCH_MARKER + '\n' + payload;
    await fs.writeFile(preloadPath, injected, 'utf-8');
    spinner.succeed('RTL engine injected into preload.');

    // 7. Repack
    spinner.start('Repacking app.asar...');
    await delay(300);
    await asar.createPackage(tmpDir, asarPath);
    spinner.succeed('Repacked successfully.');

  } finally {
    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }
  }
}

/**
 * Restore an ASAR installation from backup.
 */
async function restoreAsar(installation, spinner) {
  const { asarPath } = installation;
  const backupPath = asarPath + BACKUP_SUFFIX;

  if (fs.existsSync(backupPath)) {
    spinner.start('Restoring app.asar from backup...');
    await fs.copy(backupPath, asarPath);
    await fs.remove(backupPath);
    spinner.succeed('Original app.asar restored.');
  } else {
    spinner.warn('No backup found for app.asar.');
  }
}

/**
 * Main patch function.
 */
async function patch(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found.');
    console.error(chalk.yellow('\nTry specifying the path manually:'));
    console.error(chalk.cyan('  agy-rtl patch --path /path/to/Antigravity\n'));
    throw new Error('Installation not found.');
  }

  spinner.succeed('Found ' + installations.length + ' installation(s).');

  for (const inst of installations) {
    console.log(chalk.cyan('\n  Patching: ' + chalk.white(inst.basePath)));
    checkPermissions(inst.basePath);
    await patchAsar(inst, ora());
  }

  console.log(chalk.green.bold('\n  Antigravity patched with RTL support.'));
  console.log(chalk.cyan('  Restart Antigravity to see the changes.\n'));
}

/**
 * Main restore function.
 */
async function restore(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found.');
    throw new Error('Installation not found.');
  }

  spinner.succeed('Found ' + installations.length + ' installation(s).');

  for (const inst of installations) {
    console.log(chalk.yellow('\n  Restoring: ' + chalk.white(inst.basePath)));
    checkPermissions(inst.basePath);
    await restoreAsar(inst, ora());
  }

  console.log(chalk.green.bold('\n  Antigravity restored to original state.'));
  console.log(chalk.cyan('  Restart Antigravity for changes to take effect.\n'));
}

/**
 * Check patch status.
 */
async function status(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found.');
    return;
  }

  spinner.succeed('Found ' + installations.length + ' installation(s).');

  for (const inst of installations) {
    const backupExists = fs.existsSync(inst.asarPath + BACKUP_SUFFIX);
    const statusIcon = backupExists ? chalk.green('PATCHED') : chalk.red('NOT PATCHED');
    console.log('\n  ' + statusIcon + '  ' + chalk.white(inst.basePath));
  }
  console.log('');
}

module.exports = {
  patch,
  restore,
  status,
};
