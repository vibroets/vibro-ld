const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');
const userDir = path.join(root, 'build-user');
const userIndex = path.join(userDir, 'index.html');
const userHtml = path.join(userDir, 'user.html');
const fallback404 = path.join(userDir, '404.html');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    process.exit(1);
  }
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function replaceFileContent(filePath, search, replace) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, content.replace(search, replace), 'utf8');
}

console.log('Copying build/ to build-user/...');
copyRecursive(buildDir, userDir);

// Instead of replacing index.html with user.html (which lacks JS/CSS bundle tags),
// inject the user-mode script and splash screen into the built index.html
console.log('Injecting user-mode script into build-user/index.html...');
if (!fs.existsSync(userIndex)) {
  console.error('build-user/index.html not found after copy.');
  process.exit(1);
}

let indexContent = fs.readFileSync(userIndex, 'utf8');

// Inject the appMode=user script right after <head>
const userModeScript = `<script>try{sessionStorage.setItem('appMode','user');}catch(e){}</script>`;
if (!indexContent.includes('appMode')) {
  indexContent = indexContent.replace('<head>', '<head>' + userModeScript);
}

// Update title and theme for user module
indexContent = indexContent.replace(/<title>.*?<\/title>/, '<title>Vibro User</title>');
indexContent = indexContent.replace(/content="#2563eb"/, 'content="#d97706"');

// Add splash screen styles and markup
const splashStyle = `<style>#root-splash{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f9fafb;z-index:9999;transition:opacity .3s ease}#root-splash.hidden{opacity:0;pointer-events:none}</style>`;
if (!indexContent.includes('root-splash')) {
  indexContent = indexContent.replace('</head>', splashStyle + '</head>');
  // Add splash div and hide script before the bundle script
  const splashHtml = `<div id="root-splash"><div style="text-align:center"><div style="font-size:1.5rem;font-weight:700;color:#d97706;margin-bottom:.5rem">Vibro User</div><div style="color:#6b7280">Loading...</div></div></div>`;
  indexContent = indexContent.replace('<div id="root"></div>', splashHtml + '<div id="root"></div>');
  const hideScript = `<script>window.addEventListener('load',function(){setTimeout(function(){var s=document.getElementById('root-splash');if(s)s.classList.add('hidden');},300);});</script>`;
  indexContent = indexContent.replace('</body>', hideScript + '</body>');
}

fs.writeFileSync(userIndex, indexContent, 'utf8');

// Remove user.html from build-user since we don't need it anymore
if (fs.existsSync(userHtml)) {
  fs.rmSync(userHtml);
}

// Add a 404 fallback so deep links work when served from a mobile web server
fs.copyFileSync(userIndex, fallback404);

// Ensure the service worker registration is robust for file:// and local servers
const assetManifest = path.join(userDir, 'asset-manifest.json');
if (fs.existsSync(assetManifest)) {
  console.log('asset-manifest.json present.');
}

console.log('User module build ready at build-user/');
