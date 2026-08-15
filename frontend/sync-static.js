const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'out');
const destDir = path.resolve(__dirname, '..', 'app', 'static');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log('Successfully synced frontend/out -> app/static');
}
