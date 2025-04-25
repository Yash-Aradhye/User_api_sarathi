import express from 'express';
import PaymentController from '../controllers/payment.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
// Protected routes (require authentication)
router.use(authMiddleware);
router.post('/create-order', PaymentController.createOrder);
router.get('/get-order/:orderId', PaymentController.getOrderById);
router.post('/verify-payment', PaymentController.verifyPayment);
router.get('/get-razorpay-key', PaymentController.getRazorpayKey);
router.get('/get-user-orders', PaymentController.getUserOrders);
router.get('/get-user-order/:orderId', PaymentController.getUserOrderById);
router.get('/get-user-payment/:userId', PaymentController.getUserPaymentById);

export default router;
