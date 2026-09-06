const asar = require('@electron/asar');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ora = require('ora');
const chalk = require('chalk');
const { findInstallations } = require('./paths');
const { checkPermissions, delay } = require('./utils');

const PATCH_MARKER = 'agy-rtl-engine';
const BACKUP_SUFFIX = '.agy-rtl-backup';
const ENGINE_FILENAME = 'agy-rtl-engine.js';
const STYLES_FILENAME = 'agy-rtl-styles.css';

/**
 * Patch an unpacked Antigravity IDE installation.
 * Copies payload files and modifies workbench.html.
 */
async function patchUnpacked(installation, spinner) {
  const { workbenchDir, workbenchHtml } = installation;

  // 1. Backup
  const backupPath = workbenchHtml + BACKUP_SUFFIX;
  if (!fs.existsSync(backupPath)) {
    await fs.copy(workbenchHtml, backupPath);
    spinner.succeed('Backup created: ' + chalk.gray(path.basename(backupPath)));
  } else {
    spinner.info('Backup already exists, skipping.');
  }

  // 2. Check if already patched
  spinner.start('Checking patch status...');
  const htmlContent = await fs.readFile(workbenchHtml, 'utf-8');
  if (htmlContent.includes(PATCH_MARKER)) {
    spinner.info('IDE is already patched. Use "restore" first to re-patch.');
    return;
  }

  // 3. Copy payload files to workbench directory
  spinner.start('Copying RTL engine & styles...');
  const payloadDir = path.join(__dirname, '..', 'payload');

  await fs.copy(
    path.join(payloadDir, 'rtl-engine.js'),
    path.join(workbenchDir, ENGINE_FILENAME)
  );
  await fs.copy(
    path.join(payloadDir, 'styles.css'),
    path.join(workbenchDir, STYLES_FILENAME)
  );
  spinner.succeed('Payload files copied.');

  // 4. Inject references into workbench.html
  spinner.start('Injecting RTL support into workbench...');
  let modified = htmlContent;

  // Add stylesheet link in <head> before </head>
  const styleTag = `\n\t<!-- AGY-RTL-PATCH -->\n\t<link rel="stylesheet" href="./${STYLES_FILENAME}">\n\t<!-- /AGY-RTL-PATCH -->`;
  modified = modified.replace('</head>', `${styleTag}\n</head>`);

  // Add script before </html>
  const scriptTag = `\n<!-- AGY-RTL-PATCH -->\n<script src="./${ENGINE_FILENAME}" id="${PATCH_MARKER}"></script>\n<!-- /AGY-RTL-PATCH -->`;
  modified = modified.replace('</html>', `${scriptTag}\n</html>`);

  await fs.writeFile(workbenchHtml, modified, 'utf-8');
  spinner.succeed('RTL support injected into workbench.');
}

/**
 * Patch an ASAR-packed Antigravity installation.
 * Extracts the asar, patches files, and repacks.
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

    // 3. Find workbench.html inside extracted asar
    const possiblePaths = [
      path.join(tmpDir, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
      path.join(tmpDir, 'index.html'),
      path.join(tmpDir, 'dist', 'index.html'),
      path.join(tmpDir, 'out', 'index.html'),
    ];

    let targetHtml = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetHtml = p;
        break;
      }
    }

    if (!targetHtml) {
      spinner.warn('No patchable HTML found in this package. Skipping.');
      await fs.remove(tmpDir);
      return;
    }

    // Check if already patched
    const htmlContent = await fs.readFile(targetHtml, 'utf-8');
    if (htmlContent.includes(PATCH_MARKER)) {
      spinner.info('ASAR is already patched.');
      await fs.remove(tmpDir);
      return;
    }

    // 4. Copy payload files
    spinner.start('Injecting RTL engine...');
    const payloadDir = path.join(__dirname, '..', 'payload');
    const targetDir = path.dirname(targetHtml);

    await fs.copy(path.join(payloadDir, 'rtl-engine.js'), path.join(targetDir, ENGINE_FILENAME));
    await fs.copy(path.join(payloadDir, 'styles.css'), path.join(targetDir, STYLES_FILENAME));

    // 5. Modify HTML
    let modified = htmlContent;
    const styleTag = `\n\t<!-- AGY-RTL-PATCH -->\n\t<link rel="stylesheet" href="./${STYLES_FILENAME}">\n\t<!-- /AGY-RTL-PATCH -->`;
    const scriptTag = `\n<!-- AGY-RTL-PATCH -->\n<script src="./${ENGINE_FILENAME}" id="${PATCH_MARKER}"></script>\n<!-- /AGY-RTL-PATCH -->`;

    if (modified.includes('</head>')) {
      modified = modified.replace('</head>', `${styleTag}\n</head>`);
    }
    if (modified.includes('</html>')) {
      modified = modified.replace('</html>', `${scriptTag}\n</html>`);
    } else if (modified.includes('</body>')) {
      modified = modified.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      modified += scriptTag;
    }

    await fs.writeFile(targetHtml, modified, 'utf-8');
    spinner.succeed('RTL engine injected.');

    // 6. Repack
    spinner.start('Repacking app.asar...');
    await delay(300);
    await asar.createPackage(tmpDir, asarPath);
    spinner.succeed('Repacked successfully.');

  } finally {
    // Cleanup temp dir
    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }
  }
}

/**
 * Main patch function.
 */
async function patch(customPath) {
  const spinner = ora('Searching for Antigravity IDE...').start();

  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity IDE installation not found.');
    console.error(chalk.yellow('\nTry specifying the path manually:'));
    console.error(chalk.cyan('  agy-rtl patch --path /path/to/Antigravity-IDE\n'));
    throw new Error('Installation not found.');
  }

  spinner.succeed(`Found ${installations.length} installation(s).`);

  for (const inst of installations) {
    console.log(chalk.cyan(`\n📂 Patching: ${chalk.white(inst.basePath)}`));
    console.log(chalk.gray(`   Type: ${inst.type === 'unpacked' ? 'Unpacked App' : 'ASAR Package'}`));

    checkPermissions(inst.basePath);

    if (inst.type === 'unpacked') {
      await patchUnpacked(inst, ora());
    } else {
      await patchAsar(inst, ora());
    }
  }

  console.log(chalk.green.bold('\n✨ Antigravity IDE successfully patched with RTL support!'));
  console.log(chalk.cyan('   Please restart Antigravity IDE for changes to take effect.\n'));
}

/**
 * Restore an unpacked installation from backup.
 */
async function restoreUnpacked(installation, spinner) {
  const { workbenchDir, workbenchHtml } = installation;
  const backupPath = workbenchHtml + BACKUP_SUFFIX;

  if (fs.existsSync(backupPath)) {
    spinner.start('Restoring workbench.html from backup...');
    await fs.copy(backupPath, workbenchHtml);
    await fs.remove(backupPath);
    spinner.succeed('Workbench restored.');
  } else {
    spinner.warn('No backup found for workbench.html.');
  }

  // Remove injected payload files
  const engineFile = path.join(workbenchDir, ENGINE_FILENAME);
  const stylesFile = path.join(workbenchDir, STYLES_FILENAME);

  if (fs.existsSync(engineFile)) await fs.remove(engineFile);
  if (fs.existsSync(stylesFile)) await fs.remove(stylesFile);
  spinner.succeed('Payload files removed.');
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
    spinner.succeed('ASAR restored.');
  } else {
    spinner.warn('No backup found for app.asar.');
  }
}

/**
 * Main restore function.
 */
async function restore(customPath) {
  const spinner = ora('Searching for Antigravity IDE...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity IDE installation not found.');
    throw new Error('Installation not found.');
  }

  spinner.succeed(`Found ${installations.length} installation(s).`);

  for (const inst of installations) {
    console.log(chalk.yellow(`\n🔄 Restoring: ${chalk.white(inst.basePath)}`));

    checkPermissions(inst.basePath);

    if (inst.type === 'unpacked') {
      await restoreUnpacked(inst, ora());
    } else {
      await restoreAsar(inst, ora());
    }
  }

  console.log(chalk.green.bold('\n✨ Antigravity IDE restored to original state!'));
  console.log(chalk.cyan('   Please restart Antigravity IDE for changes to take effect.\n'));
}

/**
 * Check patch status.
 */
async function status(customPath) {
  const spinner = ora('Searching for Antigravity IDE...').start();
  const installations = findInstallations(customPath);

  if (installations.length === 0) {
    spinner.fail('Antigravity IDE installation not found.');
    return;
  }

  spinner.succeed(`Found ${installations.length} installation(s).`);

  for (const inst of installations) {
    let isPatched = false;

    if (inst.type === 'unpacked') {
      const html = await fs.readFile(inst.workbenchHtml, 'utf-8');
      isPatched = html.includes(PATCH_MARKER);
    }

    const statusIcon = isPatched ? chalk.green('● PATCHED') : chalk.red('○ NOT PATCHED');
    console.log(`\n  ${statusIcon}  ${chalk.white(inst.basePath)}`);
    console.log(chalk.gray(`            Type: ${inst.type === 'unpacked' ? 'Unpacked App' : 'ASAR Package'}`));
  }
  console.log('');
}

module.exports = {
  patch,
  restore,
  status,
};
