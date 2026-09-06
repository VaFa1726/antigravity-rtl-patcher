#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { patch, restore, status } = require('../src/patcher');

const BANNER = `
${chalk.cyan('╔══════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🌌 Antigravity RTL Patcher')}  ${chalk.gray('v2.0.0')}        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Intelligent RTL support for Antigravity IDE')} ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════╝')}
`;

program
  .name('agy-rtl')
  .description('RTL & Typography patcher for Antigravity IDE')
  .version('2.0.0');

program
  .command('patch')
  .description('Inject RTL support into Antigravity IDE')
  .option('-p, --path <path>', 'Custom path to Antigravity IDE installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await patch(options.path);
    } catch (err) {
      console.error(chalk.red('\n❌ Patch failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Restore Antigravity IDE to its original state')
  .option('-p, --path <path>', 'Custom path to Antigravity IDE installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await restore(options.path);
    } catch (err) {
      console.error(chalk.red('\n❌ Restore failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check if Antigravity IDE is currently patched')
  .option('-p, --path <path>', 'Custom path to Antigravity IDE installation')
  .action(async (options) => {
    console.log(BANNER);
    try {
      await status(options.path);
    } catch (err) {
      console.error(chalk.red('\n❌ Status check failed:'), err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
