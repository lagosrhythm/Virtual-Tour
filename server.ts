import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Duplex } from 'node:stream';
import { fileURLToPath } from 'node:url';
import express from 'express';
import app, { getTourStatus, getCurrentLiveTourId } from './lib/app';
import { writeViewerSnapshot } from './src/server/db/services';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const sockets = new Set<Duplex>();

// Static file serving for local dev
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(404).json({ error: 'Build not found. Run `npm run build` first.' });
  });
}

// Node server with WebSocket support
const server = http.createServer(app);

function encodeFrame(payload: string) {
  const data = Buffer.from(payload);

  if (data.length < 126) {
    return Buffer.concat([Buffer.from([0x81, data.length]), data]);
  }

  if (data.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
    return Buffer.concat([header, data]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(data.length), 2);
  return Buffer.concat([header, data]);
}

async function sendStatus(socket: Duplex) {
  try {
    const status = await getTourStatus();
    const viewerNoise = status.isLive ? Math.floor(Math.random() * 9) - 4 : 0;
    const payload = {
      ...status,
      viewerCount: Math.max(0, status.viewerCount + viewerNoise),
    };

    socket.write(encodeFrame(JSON.stringify(payload)));
  } catch (error) {
    console.error('Error sending status:', error);
  }
}

server.on('upgrade', (req, socket) => {
  if (req.url !== '/api/live') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));

  sockets.add(socket);
  sendStatus(socket);

  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => sockets.delete(socket));
});

// Broadcast status to WebSocket clients every 5s
setInterval(() => {
  sockets.forEach((socket) => {
    sendStatus(socket).catch((error) => {
      console.error('Error sending status to socket:', error);
    });
  });
}, 5000).unref();

// Write viewer snapshot every 30s when a live tour is active
setInterval(() => {
  if (getCurrentLiveTourId()) {
    getTourStatus().then(status => {
      if (status.isLive && getCurrentLiveTourId()) {
        void writeViewerSnapshot(getCurrentLiveTourId()!, status.viewerCount);
      }
    }).catch(() => {});
  }
}, 30_000).unref();

server.listen(port, '0.0.0.0', () => {
  console.log(`Lagos Rhythm listening on http://localhost:${port}`);
});

export default app;
