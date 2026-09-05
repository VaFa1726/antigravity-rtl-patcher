const fs = require('fs-extra');
const path = require('path');
const os = require('os');

function getAsarPath() {
  const platform = os.platform();
  
  // Possible paths where the IDE might be installed
  const paths = {
    win32: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources', 'app.asar'),
      path.join(process.env.PROGRAMFILES || '', 'antigravity', 'resources', 'app.asar')
    ],
    darwin: [
      '/Applications/Antigravity.app/Contents/Resources/app.asar',
      path.join(os.homedir(), 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar')
    ],
    linux: [
      '/opt/antigravity/resources/app.asar',
      '/usr/local/lib/antigravity/resources/app.asar'
    ]
  };

  const possiblePaths = paths[platform] || [];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('Antigravity installation not found. Please ensure it is installed in the default location.');
}

module.exports = {
  getAsarPath
};
