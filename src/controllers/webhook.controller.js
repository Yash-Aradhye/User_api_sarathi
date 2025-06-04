import WebhookService from '../services/webhook.services.js';
import crypto from 'crypto';

class WebhookController {
  async handlePaymentEvent(req, res) {
    try {
      // Verify webhook signature
      const webhookSignature = req.headers['x-razorpay-signature'];
      
      if (!webhookSignature) {
        return res.status(400).json({ error: 'Webhook signature missing' });
      }
      let isValid = false;
      // Verify webhook signature
      isValid = this.verifyWebhookSignature(
        JSON.stringify(req.body), // Convert body to string
        webhookSignature,
        process.env.RAZ_WEBHOOK_SECRET
      );
      

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      // Process the webhook event based on its type
      const event = req.body;
      
      // Handle different event types
      switch(event.event) {
        case 'payment.captured':
        case 'payment.authorized':
           console.log(`Processing ${event.event} for order: ${event.payload.payment.entity.order_id}`);
            await WebhookService.handlePaymentCaptured(event.event, event.payload.payment.entity);
            console.log(`Successfully processed ${event.event}`);
            break;
        
          
        case 'payment.failed':
          await WebhookService.handlePaymentFailed(event.event,event.payload.payment.entity);
          break;
        case 'order.paid':
          console.log(`Processing ${event.event} for order: ${event.payload.order.entity.id}`);
          await WebhookService.handleOrderPaid("order.paid", event);
          break;
        case 'order.created':
          console.log(`Processing ${event.event} for order: ${event.payload.order.entity.id}`);
          await WebhookService.handleOrderCreated(event.payload.order.entity);
          break;
          
        case 'refund.created':
          await WebhookService.handleRefundCreated(event.payload.refund.entity);
          break;
          
        default:
          // Log unhandled event type
          console.log(`Unhandled webhook event: ${event.event}`);
      }
      
      // Return 200 response quickly for webhook
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      
      // Always return 200 to prevent webhook retries
      res.status(200).json({ 
        received: true,
        error: error.message
      });
    }
  }

  verifyWebhookSignature(body, signature, secret) {
    try {
      console.log('🔐 Verifying webhook signature...');
      console.log('Body length:', body.length);
      console.log('Body type:', typeof body);
      console.log('Signature:', signature);
      console.log('Secret length:', secret?.length);
      // Ensure body is a string
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8') // Explicitly specify UTF-8 encoding
        .digest('hex');
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
      console.log('Signature valid:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ Error in signature verification:', error);
      return false;
    }
  }
}

export default new WebhookController();
