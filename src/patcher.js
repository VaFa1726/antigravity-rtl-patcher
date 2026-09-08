const asar = require('@electron/asar');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ora = require('ora');
const chalk = require('chalk');
const prompts = require('prompts');
const { findInstallations, findUtilsJs, detectInstallation } = require('./paths');
const { checkPermissions, delay } = require('./utils');
const { checkForUpdates } = require('./version-checker');
const { version: currentVersion } = require('../package.json');

const PATCH_MARKER = `/* ANTIGRAVITY_RTL_PATCH_v${currentVersion} */`;
const ANY_PATCH_MARKER_REGEX = /\/\* ANTIGRAVITY_RTL_PATCH_[^\*]+ \*\//;
const BACKUP_SUFFIX = '.agy-rtl-backup';
const INJECTION_ANCHOR = 'void win.loadURL(url);';

/**
 * Check if an extracted directory has the RTL patch installed
 */
async function getPatchStatus(extractDir) {
  const utilsPath = findUtilsJs(extractDir);
  if (!utilsPath || !fs.existsSync(utilsPath)) {
    return { patched: false, isCurrent: false, utilsPath: null };
  }

  const content = await fs.readFile(utilsPath, 'utf-8');
  if (content.includes(PATCH_MARKER)) {
    return { patched: true, isCurrent: true, utilsPath };
  }
  if (ANY_PATCH_MARKER_REGEX.test(content)) {
    return { patched: true, isCurrent: false, utilsPath };
  }
  return { patched: false, isCurrent: false, utilsPath };
}

/**
 * Patch an ASAR-packed Antigravity installation
 */
async function patchAsar(installation, spinner, force = false) {
  const { asarPath } = installation;
  const backupPath = asarPath + BACKUP_SUFFIX;
  const unpackedDir = asarPath + '.unpacked';
  const backupUnpackedDir = backupPath + '.unpacked';
  const tmpDir = path.join(os.tmpdir(), 'agy-rtl-' + Date.now());

  try {
    // 1. Detect and handle stale backups
    // If Antigravity was updated after patching, the old backup is outdated
    if (fs.existsSync(backupPath)) {
      const tmpCheck = path.join(os.tmpdir(), 'agy-rtl-check-' + Date.now());
      try {
        asar.extractAll(asarPath, tmpCheck);
        const currentPatchState = await getPatchStatus(tmpCheck);
        if (!currentPatchState.patched) {
          // Current asar is clean (Antigravity was updated) but old backup still exists
          spinner.warn('Detected Antigravity update — refreshing stale backup...');
          await fs.remove(backupPath);
          if (fs.existsSync(backupUnpackedDir)) {
            await fs.remove(backupUnpackedDir);
          }
        }
      } catch (e) {
        // If check fails, proceed with existing backup
      } finally {
        if (fs.existsSync(tmpCheck)) {
          await fs.remove(tmpCheck);
        }
      }
    }

    // 2. Backup original before any modification
    if (!fs.existsSync(backupPath)) {
      spinner.text = 'Creating backup...';
      await fs.copy(asarPath, backupPath);
      // Also backup the .unpacked directory if it exists
      if (fs.existsSync(unpackedDir)) {
        await fs.copy(unpackedDir, backupUnpackedDir);
      }
      spinner.succeed('Backup created');
    } else {
      spinner.info('Backup already exists, skipping');
    }

    // 2. Extract current asar
    spinner.start('Extracting app.asar...');
    await fs.ensureDir(tmpDir);
    asar.extractAll(asarPath, tmpDir);
    spinner.succeed('Extracted successfully');

    // 3. Check existing patch state
    const patchState = await getPatchStatus(tmpDir);

    if (patchState.patched && patchState.isCurrent && !force) {
      spinner.info(`Already patched with latest version (v${currentVersion})! Use -f or --force to re-apply.`);
      await fs.remove(tmpDir);
      return;
    }

    // If already patched with an older version or force requested, restore clean files from backup
    if (patchState.patched || force) {
      if (fs.existsSync(backupPath)) {
        spinner.start('Extracting clean base from backup for re-patching...');
        await fs.emptyDir(tmpDir);
        asar.extractAll(backupPath, tmpDir);
        spinner.succeed('Extracted clean backup successfully');
      }
    }

    // 4. Find utils.js
    spinner.start('Locating utils.js...');
    const utilsPath = findUtilsJs(tmpDir);

    if (!utilsPath) {
      spinner.warn('utils.js not found - unsupported Antigravity version');
      await fs.remove(tmpDir);
      return;
    }

    spinner.succeed('Found: ' + chalk.gray(path.relative(tmpDir, utilsPath)));

    // 5. Read utils.js content
    spinner.start('Injecting RTL engine...');
    let utilsContent = await fs.readFile(utilsPath, 'utf-8');

    // 6. Check for injection anchor
    if (!utilsContent.includes(INJECTION_ANCHOR)) {
      spinner.warn('Injection anchor not found - this Antigravity version may not be supported');
      await fs.remove(tmpDir);
      return;
    }

    // 7. Read injection payload
    const payloadPath = path.join(__dirname, '..', 'payload', 'utils-inject.js');
    let payload = await fs.readFile(payloadPath, 'utf-8');

    // Ensure payload has the versioned patch marker
    payload = payload.replace(ANY_PATCH_MARKER_REGEX, PATCH_MARKER);

    // 8. Inject payload (replace the anchor line with payload)
    utilsContent = utilsContent.replace(INJECTION_ANCHOR, payload);

    // 9. Force enable DevTools for debugging
    utilsContent = utilsContent.replace(
      /devTools:\s*!electron_1?\.app\.isPackaged/g,
      'devTools: true'
    );

    // 10. Write modified utils.js
    await fs.writeFile(utilsPath, utilsContent, 'utf-8');

    spinner.succeed('RTL engine injected successfully');

    // 11. Repack
    spinner.start('Repacking app.asar...');
    await delay(300);
    await asar.createPackage(tmpDir, asarPath);
    spinner.succeed('Repacked successfully');

  } finally {
    // Cleanup
    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }
  }
}

/**
 * Restore an ASAR installation from backup
 */
async function restoreAsar(installation, spinner) {
  const { asarPath } = installation;
  const backupPath = asarPath + BACKUP_SUFFIX;
  const unpackedDir = asarPath + '.unpacked';
  const backupUnpackedDir = backupPath + '.unpacked';

  if (fs.existsSync(backupPath)) {
    spinner.start('Restoring from backup...');
    await fs.copy(backupPath, asarPath);
    // Also restore the .unpacked directory if backup exists
    if (fs.existsSync(backupUnpackedDir)) {
      await fs.copy(backupUnpackedDir, unpackedDir);
      await fs.remove(backupUnpackedDir);
    }
    await fs.remove(backupPath);
    spinner.succeed('Original app.asar restored');
  } else {
    spinner.warn('No backup found');
  }
}

/**
 * Main patch function
 */
async function patch(customPath, skipUpdateCheck = false, force = false) {
  // Check for updates
  if (!skipUpdateCheck) {
    await checkForUpdates(false);
  }

  const spinner = ora('Searching for Antigravity...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found in common paths');
    spinner.stop();

    // Ask user to enter path manually
    const response = await prompts({
      type: 'text',
      name: 'manualPath',
      message: chalk.yellow('Enter the path to your Antigravity installation folder:'),
      validate: (val) => {
        if (!val || !val.trim()) return 'Path cannot be empty';
        if (!fs.existsSync(val.trim())) return 'Path does not exist';
        const info = detectInstallation(val.trim());
        if (!info) return 'No app.asar found at that path (expected: <path>/resources/app.asar)';
        return true;
      }
    });

    if (!response.manualPath) {
      throw new Error('No path provided — patch cancelled');
    }

    const info = detectInstallation(response.manualPath.trim());
    installations.push(info);
  }

  spinner.succeed('Found ' + installations.length + ' installation(s)');

  for (const inst of installations) {
    console.log(chalk.cyan('\n  Patching: ') + chalk.white(inst.basePath));
    checkPermissions(inst.basePath);
    await patchAsar(inst, ora(), force);
  }

  console.log(chalk.green.bold('\n  ✨ Antigravity patched successfully!'));
  console.log(chalk.cyan('  Restart Antigravity and press Ctrl + E to toggle RTL mode.\n'));
}

/**
 * Main restore function
 */
async function restore(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  let installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found');
    spinner.stop();

    // Ask user to enter path manually
    const response = await prompts({
      type: 'text',
      name: 'manualPath',
      message: chalk.yellow('Enter the path to your Antigravity installation folder:'),
      validate: (val) => {
        if (!val || !val.trim()) return 'Path cannot be empty';
        if (!fs.existsSync(val.trim())) return 'Path does not exist';
        const info = detectInstallation(val.trim());
        if (!info) return 'No app.asar found at that path';
        const backupExists = fs.existsSync(info.asarPath + BACKUP_SUFFIX);
        if (!backupExists) return 'No backup found at that path — was it patched before?';
        return true;
      }
    });

    if (!response.manualPath) {
      throw new Error('No path provided — restore cancelled');
    }

    const info = detectInstallation(response.manualPath.trim());
    installations.push(info);
  }

  spinner.succeed('Found ' + installations.length + ' installation(s)');

  for (const inst of installations) {
    console.log(chalk.yellow('\n  Restoring: ') + chalk.white(inst.basePath));
    checkPermissions(inst.basePath);
    await restoreAsar(inst, ora());
  }

  console.log(chalk.green.bold('\n  ✨ Antigravity restored to original state'));
  console.log(chalk.cyan('  Restart Antigravity for changes to take effect.\n'));
}

/**
 * Check patch status
 */
async function status(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  let installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found');
    spinner.stop();

    // Ask user to enter path manually
    const response = await prompts({
      type: 'text',
      name: 'manualPath',
      message: chalk.yellow('Enter the path to your Antigravity installation folder:'),
      validate: (val) => {
        if (!val || !val.trim()) return 'Path cannot be empty';
        if (!fs.existsSync(val.trim())) return 'Path does not exist';
        const info = detectInstallation(val.trim());
        if (!info) return 'No app.asar found at that path';
        return true;
      }
    });

    if (!response.manualPath) {
      console.log(chalk.gray('\n  No path provided — status check cancelled.\n'));
      return;
    }

    const info = detectInstallation(response.manualPath.trim());
    installations.push(info);
  }

  spinner.succeed('Found ' + installations.length + ' installation(s)');

  for (const inst of installations) {
    const backupExists = fs.existsSync(inst.asarPath + BACKUP_SUFFIX);
    let isPatched = false;
    let patchVersion = null;

    try {
      const files = asar.listPackage(inst.asarPath);
      const utilsSubpath = files.find(f => {
        const normalized = f.replace(/\\/g, '/');
        return normalized.endsWith('/utils.js') && !normalized.includes('node_modules');
      });

      if (utilsSubpath) {
        const cleanSubpath = utilsSubpath.replace(/^\//, '');
        const content = asar.extractFile(inst.asarPath, cleanSubpath).toString('utf-8');
        const match = content.match(/\/\* ANTIGRAVITY_RTL_PATCH_([^\*]+) \*\//);
        if (match) {
          isPatched = true;
          patchVersion = match[1];
        }
      }
    } catch (e) {
      isPatched = backupExists;
    }

    let statusText = '';
    if (isPatched) {
      statusText = chalk.green(`✓ PATCHED${patchVersion ? ` (${patchVersion})` : ''}`);
    } else {
      statusText = chalk.red('✗ NOT PATCHED');
    }

    console.log('\n  ' + statusText + '  ' + chalk.white(inst.basePath));

    if (backupExists) {
      console.log(chalk.gray('    Backup: ' + inst.asarPath + BACKUP_SUFFIX));
    }
  }
  console.log('');
}

module.exports = {
  patch,
  restore,
  status,
};
