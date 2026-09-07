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

const PATCH_MARKER = '/* ANTIGRAVITY_RTL_PATCH_v3 */';
const BACKUP_SUFFIX = '.agy-rtl-backup';
const INJECTION_ANCHOR = 'void win.loadURL(url);';

/**
 * Check if an ASAR is already patched by looking for the marker
 */
async function isAlreadyPatched(extractDir) {
  const utilsPath = path.join(extractDir, 'dist', 'utils.js');
  
  if (!fs.existsSync(utilsPath)) {
    return false;
  }
  
  const content = await fs.readFile(utilsPath, 'utf-8');
  return content.includes(PATCH_MARKER);
}

/**
 * Patch an ASAR-packed Antigravity installation
 */
async function patchAsar(installation, spinner) {
  const { asarPath } = installation;
  const backupPath = asarPath + BACKUP_SUFFIX;
  const tmpDir = path.join(os.tmpdir(), 'agy-rtl-' + Date.now());

  try {
    // 1. Backup
    if (!fs.existsSync(backupPath)) {
      spinner.text = 'Creating backup...';
      await fs.copy(asarPath, backupPath);
      spinner.succeed('Backup created');
    } else {
      spinner.info('Backup already exists, skipping');
    }

    // 2. Extract
    spinner.start('Extracting app.asar...');
    await fs.ensureDir(tmpDir);
    asar.extractAll(asarPath, tmpDir);
    spinner.succeed('Extracted successfully');

    // 3. Check if already patched
    if (await isAlreadyPatched(tmpDir)) {
      spinner.info('Already patched with latest version!');
      await fs.remove(tmpDir);
      return;
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
    const payload = await fs.readFile(payloadPath, 'utf-8');

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

    // 12. Repack
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

  if (fs.existsSync(backupPath)) {
    spinner.start('Restoring from backup...');
    await fs.copy(backupPath, asarPath);
    await fs.remove(backupPath);
    spinner.succeed('Original app.asar restored');
  } else {
    spinner.warn('No backup found');
  }
}

/**
 * Main patch function
 */
async function patch(customPath, skipUpdateCheck = false) {
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
    await patchAsar(inst, ora());
  }

  console.log(chalk.green.bold('\n  ✨ Antigravity patched successfully!'));
  console.log(chalk.cyan('  Restart Antigravity and press Alt + R to toggle RTL mode.\n'));
}

/**
 * Main restore function
 */
async function restore(customPath) {
  const spinner = ora('Searching for Antigravity...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found');
    throw new Error('Installation not found');
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
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity installation not found');
    return;
  }

  spinner.succeed('Found ' + installations.length + ' installation(s)');

  for (const inst of installations) {
    const backupExists = fs.existsSync(inst.asarPath + BACKUP_SUFFIX);
    const statusIcon = backupExists 
      ? chalk.green('✓ PATCHED') 
      : chalk.red('✗ NOT PATCHED');
    
    console.log('\n  ' + statusIcon + '  ' + chalk.white(inst.basePath));
    
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
