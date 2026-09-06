const https = require('https');
const chalk = require('chalk');
const { version: currentVersion } = require('../package.json');

/**
 * Compare two semantic versions.
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Fetch the latest version from npm registry.
 */
function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const url = 'https://registry.npmjs.org/antigravity-rtl-patcher/latest';
    
    https.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg.version);
        } catch (e) {
          reject(new Error('Failed to parse npm response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Check if a newer version is available and notify the user.
 * Returns: true if update is available, false otherwise
 */
async function checkForUpdates(silent = false) {
  try {
    const latestVersion = await fetchLatestVersion();
    
    if (compareVersions(latestVersion, currentVersion) > 0) {
      if (!silent) {
        console.log('');
        console.log(chalk.yellow.bold('⚠️  Update Available!'));
        console.log(chalk.white(`   Current: ${chalk.red(currentVersion)} → Latest: ${chalk.green(latestVersion)}`));
        console.log('');
        console.log(chalk.cyan('   Run one of these commands to update:'));
        console.log(chalk.gray('   • npx antigravity-rtl-patcher@latest patch'));
        console.log(chalk.gray('   • npm install -g antigravity-rtl-patcher@latest'));
        console.log('');
      }
      return true;
    }
    
    if (!silent) {
      console.log(chalk.green('✓ You are using the latest version.\n'));
    }
    return false;
  } catch (error) {
    // Silently fail if network is unavailable
    return false;
  }
}

/**
 * Show update instructions.
 */
function showUpdateInstructions() {
  console.log('');
  console.log(chalk.cyan.bold('Update Instructions:'));
  console.log('');
  console.log(chalk.white('To update to the latest version, run:'));
  console.log('');
  console.log(chalk.green('  npx antigravity-rtl-patcher@latest patch'));
  console.log(chalk.gray('  (This will automatically download and use the latest version)\n'));
  console.log(chalk.white('Or install globally:'));
  console.log('');
  console.log(chalk.green('  npm install -g antigravity-rtl-patcher@latest'));
  console.log(chalk.gray('  (Then you can use: agy-rtl patch)\n'));
}

module.exports = {
  checkForUpdates,
  showUpdateInstructions,
  compareVersions,
  currentVersion,
};
