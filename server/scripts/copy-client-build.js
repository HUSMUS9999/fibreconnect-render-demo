/*
  Copies the built frontend into the server dist folder so Render can run a single
  web service that serves both the API and the SPA.

  Expected:
  - client build output: ../client/dist
  - server runtime public dir: dist/public
*/

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', '..', 'client', 'dist');
const destDir = path.resolve(__dirname, '..', 'dist', 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean destination
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

copyDir(srcDir, destDir);

if (fs.existsSync(destDir)) {
  // eslint-disable-next-line no-console
  console.log(`Copied client build to ${destDir}`);
} else {
  // eslint-disable-next-line no-console
  console.log('No client build found to copy (client/dist missing)');
}
