const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8000;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/terraria.html';
  const filePath = path.join(__dirname, reqPath);
  // block path traversal
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found: ' + reqPath); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'text/plain', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log(`Terracraft running at http://localhost:${PORT}/terraria.html`));

