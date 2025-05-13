import express, { json } from 'express';
import cors from "cors"
import userRouter from './routes/user.routes.js';
import paymentRouter from './routes/payment.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import fs from 'fs';
import http from 'http'
import path from 'path'
import dotenv from 'dotenv';

dotenv.config();
// Use the PORT from environment (set to 3000 in your GitHub Actions workflow)
const PORT = process.env.PORT || 3000;

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

// We don't need to handle HTTPS in the Node.js app because Nginx is handling SSL termination
// Just start the HTTP server listening on all interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  process.exit(0);
});