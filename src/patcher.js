const asar = require('@electron/asar');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ora = require('ora');
const chalk = require('chalk');
const { getAsarPath } = require('./paths');
const { checkPermissions, delay } = require('./utils');

async function patch() {
  checkPermissions();
  
  const spinner = ora('Locating Antigravity IDE...').start();
  let asarPath;
  
  try {
    asarPath = getAsarPath();
    spinner.succeed(`Found Antigravity at: ${chalk.gray(asarPath)}`);
  } catch (err) {
    spinner.fail(err.message);
    throw err;
  }

  const backupPath = `${asarPath}.backup`;
  const tmpDir = path.join(os.tmpdir(), 'agy-patch-tmp');
  
  try {
    // 1. Backup
    spinner.start('Creating backup...');
    if (!fs.existsSync(backupPath)) {
      await fs.copy(asarPath, backupPath);
      spinner.succeed('Backup created successfully.');
    } else {
      spinner.info('Backup already exists, skipping.');
    }

    // 2. Extract
    spinner.start('Extracting core files...');
    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }
    await fs.ensureDir(tmpDir);
    asar.extractAll(asarPath, tmpDir);
    spinner.succeed('Core files extracted.');

    // 3. Inject Payload
    spinner.start('Injecting RTL engine & typography...');
    
    // Find the main HTML file - usually index.html in the root or a dist folder
    const possibleHtmlPaths = [
      path.join(tmpDir, 'index.html'),
      path.join(tmpDir, 'out', 'index.html'),
      path.join(tmpDir, 'dist', 'index.html')
    ];
    
    let targetHtml = null;
    for (const p of possibleHtmlPaths) {
      if (fs.existsSync(p)) {
        targetHtml = p;
        break;
      }
    }

    if (!targetHtml) {
      throw new Error('Could not find the main HTML file to inject.');
    }

    let htmlContent = await fs.readFile(targetHtml, 'utf-8');
    
    // Read payload files
    const engineCode = await fs.readFile(path.join(__dirname, '..', 'payload', 'rtl-engine.js'), 'utf-8');
    const stylesCode = await fs.readFile(path.join(__dirname, '..', 'payload', 'styles.css'), 'utf-8');

    // Check if already patched
    if (htmlContent.includes('agy-rtl-engine')) {
      spinner.info('IDE is already patched.');
      await fs.remove(tmpDir);
      return;
    }

    const injection = `
      <!-- AGY RTL PATCH -->
      <style id="agy-rtl-styles">${stylesCode}</style>
      <script id="agy-rtl-engine">${engineCode}</script>
      <!-- END AGY RTL PATCH -->
    `;

    // Inject just before </body>
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${injection}\n</body>`);
    } else {
      // Fallback
      htmlContent += injection;
    }

    await fs.writeFile(targetHtml, htmlContent);
    spinner.succeed('Payload injected into UI.');

    // 4. Repack
    spinner.start('Repacking core files...');
    await delay(500); // Give file system a moment
    await asar.createPackage(tmpDir, asarPath);
    spinner.succeed('Core repacked successfully.');

    // 5. Cleanup
    spinner.start('Cleaning up...');
    await fs.remove(tmpDir);
    spinner.succeed('Cleanup complete.');

    console.log(chalk.green.bold('\n✨ Antigravity IDE successfully patched with RTL support!'));
    console.log(chalk.cyan('Please restart Antigravity for the changes to take effect.\n'));

  } catch (err) {
    spinner.fail('An error occurred during patching.');
    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }
    throw err;
  }
}

async function restore() {
  checkPermissions();
  const spinner = ora('Locating Antigravity IDE...').start();
  
  let asarPath;
  try {
    asarPath = getAsarPath();
    spinner.succeed(`Found Antigravity at: ${chalk.gray(asarPath)}`);
  } catch (err) {
    spinner.fail(err.message);
    throw err;
  }

  const backupPath = `${asarPath}.backup`;
  
  spinner.start('Restoring from backup...');
  if (fs.existsSync(backupPath)) {
    await fs.copy(backupPath, asarPath);
    await fs.remove(backupPath);
    spinner.succeed('Restored successfully.');
    console.log(chalk.green.bold('\n✨ Antigravity IDE restored to original state!'));
  } else {
    spinner.fail('No backup found. The IDE might not be patched or backup was removed.');
  }
}

module.exports = {
  patch,
  restore
};
