const chalk = require('chalk');

function checkPermissions() {
  const isWindows = process.platform === 'win32';
  
  if (!isWindows) {
    // Check if running as root
    const isRoot = process.getuid && process.getuid() === 0;
    if (!isRoot) {
      console.error(chalk.red.bold('\n⚠️  Permission Denied!'));
      console.error(chalk.white('Modifying system applications requires administrator privileges.'));
      console.error(chalk.white(`Please run the command with ${chalk.yellow('sudo')}:\n`));
      console.error(chalk.cyan('  sudo npx agy-rtl patch\n'));
      process.exit(1);
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  checkPermissions,
  delay
};
