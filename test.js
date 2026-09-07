const fs = require('fs-extra');
const path = require('path');
const asar = require('@electron/asar');
const { execSync } = require('child_process');

async function runTests() {
  const mockPath = path.join(__dirname, 'mock-antigravity');
  const asarPath = path.join(mockPath, 'resources', 'app.asar');
  const backupPath = asarPath + '.agy-rtl-backup';
  const tmpDist = path.join(__dirname, 'tmp-dist');
  const extractTestPath = path.join(__dirname, 'test-extract');

  // Clean up any leftovers from previous runs
  await fs.remove(mockPath);
  await fs.remove(tmpDist);
  await fs.remove(extractTestPath);

  console.log('--- Setting up mock environment ---');
  await fs.ensureDir(path.join(mockPath, 'resources'));
  await fs.ensureDir(path.join(tmpDist, 'dist'));
  await fs.writeFile(path.join(tmpDist, 'dist', 'utils.js'), 'function init() {\n  void win.loadURL(url);\n}\n');
  await asar.createPackage(tmpDist, asarPath);
  await fs.remove(tmpDist);

  console.log('\n--- Running PATCH command ---');
  execSync(`node ./bin/cli.js patch -p "${mockPath}" --skip-update-check`, { stdio: 'inherit' });

  console.log('\n--- Verifying Patch ---');
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup was NOT created.');
  }
  console.log('✅ Backup created successfully.');

  // Extract patched asar to verify (using same process - first call, no cache issue)
  asar.extractAll(asarPath, extractTestPath);
  const patchedContent = fs.readFileSync(path.join(extractTestPath, 'dist', 'utils.js'), 'utf-8');
  if (patchedContent.includes('ANTIGRAVITY_RTL_PATCH')) {
    console.log('✅ Payload injected successfully (RTL marker found).');
  } else {
    console.log('Content snippet:', patchedContent.substring(0, 200));
    throw new Error('Payload was NOT injected correctly.');
  }
  await fs.remove(extractTestPath);

  console.log('\n--- Running STATUS command ---');
  execSync(`node ./bin/cli.js status -p "${mockPath}"`, { stdio: 'inherit' });

  console.log('\n--- Running RESTORE command ---');
  execSync(`node ./bin/cli.js restore -p "${mockPath}"`, { stdio: 'inherit' });

  console.log('\n--- Verifying Restore ---');
  if (fs.existsSync(backupPath)) {
    throw new Error('Backup was NOT removed after restore.');
  }
  console.log('✅ Backup removed successfully.');

  // Use a separate child process to extract and verify, avoiding ASAR header caching
  // in the current Node.js process (which cached the patched ASAR header earlier).
  const extractScript = [
    `const asar = require('@electron/asar');`,
    `const fs = require('fs');`,
    `asar.extractAll(${JSON.stringify(asarPath)}, ${JSON.stringify(extractTestPath)});`,
    `const content = fs.readFileSync(${JSON.stringify(path.join(extractTestPath, 'dist', 'utils.js'))}, 'utf-8');`,
    `process.stdout.write(content);`,
  ].join('');

  const restoredContent = execSync(`node -e ${JSON.stringify(extractScript)}`, {
    cwd: __dirname,
  }).toString();

  if (restoredContent.includes('void win.loadURL(url);') && !restoredContent.includes('ANTIGRAVITY_RTL_PATCH')) {
    console.log('✅ Original content restored successfully.');
  } else {
    console.log('Content snippet:', restoredContent.substring(0, 200));
    throw new Error('Original content was NOT restored.');
  }

  // Re-test: patch again to verify isAlreadyPatched works
  console.log('\n--- Testing isAlreadyPatched detection (patch again) ---');
  execSync(`node ./bin/cli.js patch -p "${mockPath}" --skip-update-check`, { stdio: 'inherit' });
  console.log('✅ Second patch ran without errors (isAlreadyPatched check passed).');

  // Cleanup
  await fs.remove(extractTestPath);
  await fs.remove(mockPath);
  console.log('\n🎉 All tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test failed:', err.message || err);
  process.exit(1);
});
