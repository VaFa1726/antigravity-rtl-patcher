const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Known installation paths for Antigravity IDE across all platforms.
 * Both the IDE (unpacked) and the standalone app (asar) are supported.
 */
function getSearchPaths() {
  const home = os.homedir();
  const platform = os.platform();

  const common = [
    // Downloads (common for manual installs)
    path.join(home, 'Downloads', 'Antigravity-IDE'),
    path.join(home, 'Downloads', 'Antigravity-x64'),
    path.join(home, 'Downloads', 'Antigravity'),
    // Desktop
    path.join(home, 'Desktop', 'Antigravity-IDE'),
    path.join(home, 'Desktop', 'Antigravity-x64'),
  ];

  const platformPaths = {
    linux: [
      ...common,
      '/opt/antigravity-ide',
      '/opt/Antigravity-IDE',
      '/opt/antigravity',
      '/usr/lib/antigravity-ide',
      '/usr/share/antigravity-ide',
      path.join(home, '.local', 'share', 'antigravity-ide'),
      path.join(home, '.local', 'lib', 'antigravity-ide'),
    ],
    darwin: [
      '/Applications/Antigravity IDE.app/Contents',
      path.join(home, 'Applications', 'Antigravity IDE.app', 'Contents'),
      '/Applications/Antigravity.app/Contents',
      ...common,
    ],
    win32: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity-ide'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity IDE'),
      path.join(process.env.PROGRAMFILES || '', 'Antigravity IDE'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity'),
      ...common,
    ],
  };

  return platformPaths[platform] || common;
}

/**
 * Detect the type of Antigravity installation.
 * Returns: { type: 'unpacked' | 'asar', basePath, workbenchDir, workbenchHtml }
 */
function detectInstallation(basePath) {
  // Type 1: Unpacked app directory (IDE version)
  const unpackedApp = path.join(basePath, 'resources', 'app');
  const workbenchUnpacked = path.join(
    unpackedApp,
    'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'
  );

  if (fs.existsSync(workbenchUnpacked)) {
    return {
      type: 'unpacked',
      basePath,
      appDir: unpackedApp,
      workbenchDir: path.dirname(workbenchUnpacked),
      workbenchHtml: workbenchUnpacked,
    };
  }

  // Type 2: ASAR packed app
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
 * Find all Antigravity IDE installations on the system.
 */
function findInstallations(customPath) {
  const results = [];

  if (customPath) {
    const info = detectInstallation(customPath);
    if (info) {
      results.push(info);
    }
    return results;
  }

  const searchPaths = getSearchPaths();
  for (const sp of searchPaths) {
    if (fs.existsSync(sp)) {
      const info = detectInstallation(sp);
      if (info) {
        results.push(info);
      }
    }
  }

  return results;
}

module.exports = {
  findInstallations,
  detectInstallation,
};
