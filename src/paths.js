const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Resolve the real user home directory.
 * When running under sudo, os.homedir() returns /root.
 * We use SUDO_USER to find the actual user's home.
 */
function resolveHome() {
  let home = os.homedir();
  if (process.env.SUDO_USER) {
    const sudoHome = process.platform === 'darwin'
      ? path.join('/Users', process.env.SUDO_USER)
      : path.join('/home', process.env.SUDO_USER);
    if (fs.existsSync(sudoHome)) {
      home = sudoHome;
    }
  }
  return home;
}

/**
 * Known installation paths for Antigravity across platforms.
 * Only targets the Antigravity desktop app (not the IDE).
 */
function getSearchPaths() {
  const home = resolveHome();
  const platform = os.platform();

  const common = [
    path.join(home, 'Downloads', 'Antigravity'),
    path.join(home, 'Downloads', 'Antigravity-x64'),
    path.join(home, 'Desktop', 'Antigravity'),
    path.join(home, 'Desktop', 'Antigravity-x64'),
  ];

  const platformPaths = {
    linux: [
      '/opt/antigravity',
      '/opt/Antigravity',
      '/usr/lib/antigravity',
      '/usr/share/antigravity',
      path.join(home, '.local', 'share', 'antigravity'),
      path.join(home, '.local', 'lib', 'antigravity'),
      ...common,
    ],
    darwin: [
      '/Applications/Antigravity.app/Contents',
      path.join(home, 'Applications', 'Antigravity.app', 'Contents'),
      ...common,
    ],
    win32: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity'),
      path.join(process.env.PROGRAMFILES || '', 'Antigravity'),
      ...common,
    ],
  };

  return platformPaths[platform] || common;
}

/**
 * Detect an Antigravity installation at a given base path.
 * Looks for an ASAR package at resources/app.asar.
 */
function detectInstallation(basePath) {
  const asarPath = path.join(basePath, 'resources', 'app.asar');
  if (fs.existsSync(asarPath)) {
    return {
      type: 'asar',
      basePath,
      asarPath,
    };
  }
  return null;
}

/**
 * Find all Antigravity installations on the system.
 */
function findInstallations(customPath) {
  const results = [];

  if (customPath) {
    const info = detectInstallation(customPath);
    if (info) results.push(info);
    return results;
  }

  const searchPaths = getSearchPaths();
  for (const sp of searchPaths) {
    if (fs.existsSync(sp)) {
      const info = detectInstallation(sp);
      if (info) results.push(info);
    }
  }

  return results;
}

module.exports = {
  findInstallations,
  detectInstallation,
};
