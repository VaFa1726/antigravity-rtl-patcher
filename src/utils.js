const chalk = require('chalk');

/**
 * Check if the current process has sufficient permissions
 * to modify system-level application files.
 */
function checkPermissions(targetPath) {
  const isWindows = process.platform === 'win32';

  if (!isWindows) {
    const isRoot = process.getuid && process.getuid() === 0;
    // Check if the target is in a user-writable directory
    const isUserDir = targetPath && targetPath.startsWith(require('os').homedir());

    if (!isRoot && !isUserDir) {
      console.error(chalk.red.bold('\n⚠️  Permission Denied!'));
      console.error(chalk.white('Modifying system applications requires administrator privileges.'));
      console.error(chalk.white(`Please run with ${chalk.yellow('sudo')}:\n`));
      console.error(chalk.cyan('  sudo npx antigravity-rtl-patch patch\n'));
      process.exit(1);
    }
  }
}

/**
 * Simple async delay helper.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  checkPermissions,
  delay,
};
