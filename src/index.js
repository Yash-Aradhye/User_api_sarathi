import express, { json } from 'express';
import cors from "cors"
import userRouter from './routes/user.routes.js';
import paymentRouter from './routes/payment.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import fs from 'fs';
import http from 'http'
import https from 'https'
import path from 'path'
import dotenv from 'dotenv';
import httpsConfig from '../https-config.js';

dotenv.config();
// Use non-privileged ports
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const PORT = process.env.PORT || 3006; // Fallback port
const DOMAIN_NAME = process.env.DOMAIN_NAME;

const app = express();
app.use(json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use('/api/user', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/webhook', webhookRouter)
app.post('/api/print-payload', (req, res) => {
  //save payload in ./payload.txt file for debug
  
  const payload = JSON.stringify(req.body, null, 2);
  fs.writeFile('./payload.txt', payload, (err) => {
    if (err) {
      console.error('Error writing to file', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Payload saved to file');
  });

  console.log('Payload:', req.body);
  res.status(200).json({ message: 'Payload received' });
})
app.get('/', (req, res) => {
  res.status(200).json({ message: 'HEALTH CHECK...' });
})

// HTTP server that serves the app (not just for redirects)
const httpServer = http.createServer(app);

let httpsServer;

try {
  // Try to load SSL certificates
  httpsServer = https.createServer({
    key: httpsConfig.key,
    cert: httpsConfig.cert
  }, app);
  
  // Start HTTPS server on non-privileged port
  httpsServer.listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT} (${DOMAIN_NAME})`);
  });
  
  // Start HTTP server on non-privileged port
} catch (error) {
  console.error('Failed to load SSL certificates, falling back to HTTP only:', error);
  
  // Fallback to HTTP only if certificates are not available
  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT} (no HTTPS)`);
  });
}

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  if (httpsServer) httpsServer.close();
  httpServer.close();
  process.exit(0);
});



