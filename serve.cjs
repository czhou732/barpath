#!/usr/bin/env node
// Simple static file server for Barpath production build
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || '5174');
const DIR = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  
  // SPA fallback: if file doesn't exist, serve index.html
  if (!fs.existsSync(filePath)) filePath = path.join(DIR, 'index.html');
  
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Barpath serving on http://0.0.0.0:${PORT}`);
});

// Keep alive
process.on('SIGTERM', () => process.exit(0));
setInterval(() => {}, 1 << 30); // prevent exit
