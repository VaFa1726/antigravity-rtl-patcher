#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { patch, restore, status } = require('../src/patcher');

const BANNER = `
${chalk.cyan('Antigravity Smart RTL Patcher')} ${chalk.gray('v2.3.3')}
`;

program
  .name('agy-rtl')
  .description('RTL patcher for Antigravity')
  .version('2.3.3');

program
  .command('patch')
  .description('Inject RTL support into Antigravity')
  .option('-p, --path <path>', 'Custom path to Antigravity installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await patch(options.path);
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

program.parse(process.argv);
