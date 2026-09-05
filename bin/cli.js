#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { patch, restore } = require('../src/patcher');

program
  .name('agy-rtl')
  .description('RTL & Typography patcher for Antigravity IDE')
  .version('1.0.0');

program
  .command('patch')
  .description('Inject RTL support into Antigravity IDE')
  .action(async () => {
    try {
      console.log(chalk.cyan.bold('\n🚀 Starting Antigravity RTL Patcher...'));
      await patch();
    } catch (err) {
      console.error(chalk.red('\n❌ Patch failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Restore Antigravity IDE to its original state')
  .action(async () => {
    try {
      console.log(chalk.yellow.bold('\n🔄 Restoring Antigravity...'));
      await restore();
    } catch (err) {
      console.error(chalk.red('\n❌ Restore failed:'), err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
