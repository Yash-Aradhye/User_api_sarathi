import express, { json } from 'express';
import cors from "cors"
import userRouter from './routes/user.routes.js';
import paymentRouter from './routes/payment.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import fs  from 'fs';
import http from 'http'
import https from 'https'
import path from 'path'
import dotenv from 'dotenv';
import httpsConfig from '../https-config.js';
dotenv.config();
const PORT = process.env.PORT || 3000;
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


// HTTP server (for redirect only)
const httpServer = http.createServer((req, res) => {
  // Redirect all HTTP traffic to HTTPS
  res.writeHead(301, { 
    Location: `https://${req.headers.host}${req.url}` 
  });
  res.end();
});

let httpsServer;

try {
  // Try to load SSL certificates
  
  
  httpsServer = https.createServer({
    key: httpsConfig.key,
    cert: httpsConfig.cert
  }, app);
  
  // Start HTTPS server
  httpsServer.listen(443, () => {
    console.log(`HTTPS server running on port 443 (${DOMAIN_NAME})`);
  });
  
  // Start HTTP server (for redirects)
  httpServer.listen(80, () => {
    console.log('HTTP server running on port 80 (redirecting to HTTPS)');
  });
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



