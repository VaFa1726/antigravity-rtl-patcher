#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { patch, restore, status } = require('../src/patcher');
const { checkForUpdates, showUpdateInstructions, currentVersion } = require('../src/version-checker');

const BANNER = `
${chalk.cyan('Antigravity Smart RTL Patcher')} ${chalk.gray('v' + currentVersion)}
`;

program
  .name('agy-rtl')
  .description('RTL patcher for Antigravity')
  .version(currentVersion);

program
  .command('patch')
  .description('Inject RTL support into Antigravity')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .option('--skip-update-check', 'Skip checking for updates')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await patch(options.path, options.skipUpdateCheck);
    } catch (err) {
      console.error(chalk.red('\nPatch failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Remove RTL patch and restore Antigravity')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await restore(options.path);
    } catch (err) {
      console.error(chalk.red('\nRestore failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check current patch status')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await status(options.path);
    } catch (err) {
      console.error(chalk.red('\nStatus check failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Check for updates and show installation instructions')
  .action(async () => {
    console.log(BANNER);
    console.log(chalk.cyan('Checking for updates...\n'));
    const hasUpdate = await checkForUpdates(false);
    if (!hasUpdate) {
      showUpdateInstructions();
    }
  });

program.parse(process.argv);

