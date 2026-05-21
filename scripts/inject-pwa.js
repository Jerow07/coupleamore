const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

const appleTags = [
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Couple" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
].join('\n  ');

const swScript = `<script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  </script>`;

// Inyectar antes de </head>
if (!html.includes('apple-mobile-web-app-capable')) {
  html = html.replace('</head>', `  ${appleTags}\n  ${swScript}\n</head>`);
  fs.writeFileSync(indexPath, html);
  console.log('PWA meta tags injected into dist/index.html');
} else {
  console.log('PWA meta tags already present, skipping');
}
