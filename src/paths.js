const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Known installation paths for Antigravity across all platforms.
 * Both the IDE (unpacked) and the standalone app (asar) are supported.
 */
function getSearchPaths() {
  const home = os.homedir();
  const platform = os.platform();

  const common = [
    // Antigravity (primary target)
    path.join(home, 'Downloads', 'Antigravity'),
    path.join(home, 'Downloads', 'Antigravity-x64'),
    path.join(home, 'Desktop', 'Antigravity'),
    path.join(home, 'Desktop', 'Antigravity-x64'),
    // Antigravity IDE (backward compatibility)
    path.join(home, 'Downloads', 'Antigravity-IDE'),
    path.join(home, 'Desktop', 'Antigravity-IDE'),
  ];

  const platformPaths = {
    linux: [
      // Antigravity (primary)
      '/opt/antigravity',
      '/opt/Antigravity',
      '/usr/lib/antigravity',
      '/usr/share/antigravity',
      path.join(home, '.local', 'share', 'antigravity'),
      path.join(home, '.local', 'lib', 'antigravity'),
      // Antigravity IDE (fallback)
      '/opt/antigravity-ide',
      '/opt/Antigravity-IDE',
      '/usr/lib/antigravity-ide',
      '/usr/share/antigravity-ide',
      path.join(home, '.local', 'share', 'antigravity-ide'),
      path.join(home, '.local', 'lib', 'antigravity-ide'),
      ...common,
    ],
    darwin: [
      // Antigravity (primary)
      '/Applications/Antigravity.app/Contents',
      path.join(home, 'Applications', 'Antigravity.app', 'Contents'),
      // Antigravity IDE (fallback)
      '/Applications/Antigravity IDE.app/Contents',
      path.join(home, 'Applications', 'Antigravity IDE.app', 'Contents'),
      ...common,
    ],
    win32: [
      // Antigravity (primary)
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity'),
      path.join(process.env.PROGRAMFILES || '', 'Antigravity'),
      // Antigravity IDE (fallback)
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity-ide'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity IDE'),
      path.join(process.env.PROGRAMFILES || '', 'Antigravity IDE'),
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
 * Find all Antigravity installations on the system.
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
