import express from 'express';
import WebhookController from '../controllers/webhook.controller.js';

const router = express.Router();

// Webhook routes - no auth middleware needed as these are called by Razorpay
router.post('/', WebhookController.handlePaymentEvent.bind(WebhookController));

export default router;
