#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { patch, restore, status } = require('../src/patcher');
const { checkForUpdates, showUpdateInstructions, currentVersion } = require('../src/version-checker');

/**
 * Display colorful banner with gradient effect
 */
function showBanner() {
  try {
    const bannerText = figlet.textSync('Antigravity RTL', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    });

    // Gradient colors
    const colors = [
      { r: 51, g: 135, b: 255 },   // Blue
      { r: 242, g: 80, b: 65 },    // Red  
      { r: 223, g: 172, b: 42 },   // Yellow
      { r: 145, g: 196, b: 91 }    // Green
    ];

    const lines = bannerText.split('\n');
    console.log('');
    
    lines.forEach((line, lineIndex) => {
      if (!line.trim()) return;
      
      let coloredLine = '';
      const chars = line.split('');
      const totalChars = chars.filter(c => c !== ' ').length;
      let charIndex = 0;
      
      chars.forEach(char => {
        if (char === ' ') {
          coloredLine += ' ';
        } else {
          const progress = totalChars > 1 ? charIndex / (totalChars - 1) : 0;
          const segmentCount = colors.length - 1;
          const segmentFloat = progress * segmentCount;
          const segmentIndex = Math.min(Math.floor(segmentFloat), segmentCount - 1);
          const segmentProgress = segmentFloat - segmentIndex;
          
          const c1 = colors[segmentIndex];
          const c2 = colors[segmentIndex + 1];
          
          const r = Math.round(c1.r + segmentProgress * (c2.r - c1.r));
          const g = Math.round(c1.g + segmentProgress * (c2.g - c1.g));
          const b = Math.round(c1.b + segmentProgress * (c2.b - c1.b));
          
          coloredLine += `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`;
          charIndex++;
        }
      });
      
      console.log(coloredLine);
    });
    
    console.log('');
    console.log(chalk.gray(`  Advanced RTL & Typography Control | v${currentVersion}\n`));
  } catch (err) {
    // Fallback banner
    console.log(chalk.cyan.bold(`\n✨ Antigravity Smart RTL Patcher v${currentVersion}\n`));
  }
}

// Show banner
showBanner();

// CLI setup
program
  .name('agy-rtl')
  .description('Advanced RTL patcher for Antigravity')
  .version(currentVersion);

program
  .command('patch')
  .description('Inject advanced RTL support into Antigravity')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .option('--skip-update-check', 'Skip checking for updates')
  .action(async (options) => {
    try {
      await patch(options.path, options.skipUpdateCheck);
    } catch (err) {
      console.error(chalk.red('\n✖ Patch failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Remove RTL patch and restore original Antigravity')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .action(async (options) => {
    try {
      await restore(options.path);
    } catch (err) {
      console.error(chalk.red('\n✖ Restore failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check current patch status')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .action(async (options) => {
    try {
      await status(options.path);
    } catch (err) {
      console.error(chalk.red('\n✖ Status check failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Check for updates and show installation instructions')
  .action(async () => {
    console.log(chalk.cyan('Checking for updates...\n'));
    const hasUpdate = await checkForUpdates(false);
    if (!hasUpdate) {
      showUpdateInstructions();
    }
  });

program.parse(process.argv);
