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
    path.join(home, 'Downloads', 'antigravity'),
    path.join(home, 'Downloads', 'Antigravity-x64'),
    path.join(home, 'Downloads', 'antigravity-x64'),
    path.join(home, 'Downloads', 'Antigravity-linux-x64'),
    path.join(home, 'Downloads', 'antigravity-linux-x64'),
    path.join(home, 'Downloads', 'Antigravity-linux-arm64'),
    path.join(home, 'Downloads', 'antigravity-linux-arm64'),
    path.join(home, 'Desktop', 'Antigravity'),
    path.join(home, 'Desktop', 'antigravity'),
    path.join(home, 'Desktop', 'Antigravity-x64'),
    path.join(home, 'Desktop', 'antigravity-x64'),
    path.join(home, 'Desktop', 'Antigravity-linux-x64'),
    path.join(home, 'Desktop', 'antigravity-linux-x64'),
    path.join(home, 'Desktop', 'Antigravity-linux-arm64'),
    path.join(home, 'Desktop', 'antigravity-linux-arm64'),
  ];

  const platformPaths = {
    linux: [
      '/opt/antigravity',
      '/opt/Antigravity',
      '/usr/lib/antigravity',
      '/usr/lib64/antigravity',
      '/usr/share/antigravity',
      '/usr/local/share/antigravity',
      '/usr/local/lib/antigravity',
      // Snap package paths (note: read-only filesystem)
      '/snap/antigravity/current',
      path.join(home, 'snap', 'antigravity', 'current'),
      // User local installations
      path.join(home, '.local', 'share', 'antigravity'),
      path.join(home, '.local', 'lib', 'antigravity'),
      path.join(home, 'Applications'),
      path.join(home, 'apps'),
      ...common,
    ],
    darwin: [
      '/Applications/Antigravity.app',
      '/Applications/Antigravity.app/Contents',
      '/Applications/antigravity.app',
      '/Applications/antigravity.app/Contents',
      path.join(home, 'Applications', 'Antigravity.app'),
      path.join(home, 'Applications', 'Antigravity.app', 'Contents'),
      path.join(home, 'Applications', 'antigravity.app'),
      path.join(home, 'Applications', 'antigravity.app', 'Contents'),
      // macOS Downloads with .app extension
      path.join(home, 'Downloads', 'Antigravity.app'),
      path.join(home, 'Downloads', 'Antigravity.app', 'Contents'),
      path.join(home, 'Downloads', 'antigravity.app'),
      path.join(home, 'Downloads', 'antigravity.app', 'Contents'),
      path.join(home, 'Desktop', 'Antigravity.app'),
      path.join(home, 'Desktop', 'Antigravity.app', 'Contents'),
      path.join(home, 'Desktop', 'antigravity.app'),
      path.join(home, 'Desktop', 'antigravity.app', 'Contents'),
      ...common,
    ],
    win32: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity'),
      path.join(process.env.LOCALAPPDATA || '', 'antigravity'),
      path.join(process.env.LOCALAPPDATA || '', 'Antigravity'),
      path.join(process.env.PROGRAMFILES || '', 'Antigravity'),
      path.join(process.env.PROGRAMFILES || '', 'antigravity'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'Antigravity'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'antigravity'),
      ...common,
    ],
  };

  return platformPaths[platform] || common;
}

/**
 * Detect an Antigravity installation at a given base path.
 * Looks for an ASAR package at resources/app.asar (or macOS variants).
 * Falls back to recursive search (max depth 3) if static paths don't match.
 * 
 * @param {string} basePath - Can be installation folder, resources folder, or direct app.asar file
 */
function detectInstallation(basePath) {
  // Handle direct app.asar file path
  if (basePath.endsWith('app.asar') && fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return {
      type: 'asar',
      basePath: path.dirname(path.dirname(basePath)), // Go up to installation root
      asarPath: basePath,
    };
  }

  // Static well-known paths
  const candidates = [
    path.join(basePath, 'resources', 'app.asar'),
    path.join(basePath, 'Resources', 'app.asar'),
    path.join(basePath, 'Contents', 'Resources', 'app.asar'),
    path.join(basePath, 'Contents', 'resources', 'app.asar'),
  ];

  for (const asarPath of candidates) {
    if (fs.existsSync(asarPath)) {
      return {
        type: 'asar',
        basePath,
        asarPath,
      };
    }
  }

  // Recursive fallback: search for app.asar in subdirectories (max depth 3)
  // This handles non-standard layouts like Snap: <base>/current/resources/app.asar
  const found = findAsarRecursive(basePath, 3);
  if (found) {
    return {
      type: 'asar',
      basePath,
      asarPath: found,
    };
  }

  return null;
}

/**
 * Recursively search for app.asar under a directory.
 * @param {string} dir - Directory to search
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {string|null} - Full path to app.asar or null
 */
function findAsarRecursive(dir, maxDepth) {
  if (maxDepth <= 0) return null;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name === 'app.asar') {
        return fullPath;
      }

      if (entry.isDirectory()) {
        const found = findAsarRecursive(fullPath, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch (e) {
    // Ignore permission errors
  }

  return null;
}

/**
 * Find utils.js inside an extracted ASAR directory.
 * Searches common locations and falls back to recursive search.
 */
function findUtilsJs(extractDir) {
  // Common locations
  const candidates = [
    path.join(extractDir, 'dist', 'utils.js'),
    path.join(extractDir, 'out', 'utils.js'),
    path.join(extractDir, 'app', 'utils.js'),
    path.join(extractDir, 'src', 'utils.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Recursive fallback - find any utils.js (skip node_modules)
  function searchDir(dir, depth) {
    if (depth > 5) return null;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && entry.name === 'utils.js') {
          return fullPath;
        }
        
        if (entry.isDirectory()) {
          const found = searchDir(fullPath, depth + 1);
          if (found) return found;
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
    
    return null;
  }

  return searchDir(extractDir, 0);
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
  findUtilsJs,
};
