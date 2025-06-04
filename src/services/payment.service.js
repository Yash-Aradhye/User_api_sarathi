import { db } from '../../config/firebase.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

class PaymentService {
  constructor() {
    this.userCollection = db.collection('users');
    this.razorpay = new Razorpay({
      key_id: process.env.RAZ_KEY_ID,
      key_secret: process.env.RAZ_KEY_SECRET,
    });
  }

  async createOrder(userId, amount, currency = 'INR', receipt = 'Receipt', notes = {}) {
    try {
      // Verify user exists
      const userDoc = await this.userCollection.doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      // Create order in Razorpay
      const orderOptions = {
        amount: amount * 100, // Amount in paise
        currency,
        receipt,
        notes,
      };
      
      const order = await this.razorpay.orders.create(orderOptions);
      
      // Add order to user's orders array in Firestore
      const orderData = {
        orderId: order.id,
        amount: order.amount / 100, // Store in rupees
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        notes: order.notes,
        createdAt: new Date(),
        paymentStatus: 'pending',
      };
      
      // Update user document with new order
      await this.userCollection.doc(userId).update({
        currentOrderId: order.id,
        orderIds: FieldValue.arrayUnion(order.id),
        orders: FieldValue.arrayUnion(orderData)
      });
      
      return { ...order, key_id: process.env.RAZ_KEY_ID };
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }
  
  async getOrderById(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  async verifyPayment(paymentData) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;
      
      // Generate signature for verification
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZ_KEY_SECRET)
        .update(text)
        .digest('hex');
      
      // Verify signature
      const isSignatureValid = generated_signature === razorpay_signature;
      
      if (!isSignatureValid) {
        throw new Error('Invalid payment signature');
      }
      
      // Get payment details
      const payment = await this.razorpay.payments.fetch(razorpay_payment_id);
      
      // Find user with this order and update payment status
      const usersSnapshot = await this.userCollection
        .where('orders', 'array-contains-any', [{ orderId: razorpay_order_id }])
        .get();
      
      if (usersSnapshot.empty) {
        throw new Error('Order not found in user records');
      }
      
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update order in user's array
      const updatedOrders = userData.orders.map(order => {
        if (order.orderId === razorpay_order_id) {
          return {
            ...order,
            paymentStatus: 'completed',
            paymentId: razorpay_payment_id,
            paymentDetails: payment,
            updatedAt: new Date()
          };
        }
        return order;
      });
      
      // Update Firestore with payment information
      await this.userCollection.doc(userDoc.id).update({
        orders: updatedOrders,
      });
      
      return { success: true, payment };
    } catch (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }
  
  async getUserOrders(userId) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      return userData.orders || [];
    } catch (error) {
      throw new Error(`Error fetching user orders: ${error.message}`);
    }
  }
  
  async getUserOrderById(userId, orderId) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const order = userData.orders?.find(order => order.orderId === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      throw new Error(`Error fetching user order: ${error.message}`);
    }
  }

  async getUserPaymentByUserId(userId) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      // Filter only completed payments
      const completedOrders = userData.orders?.filter(order => order.paymentStatus === 'completed') || [];
      
      return completedOrders;
    } catch (error) {
      throw new Error(`Error fetching user payments: ${error.message}`);
    }
  }

  getRazorpayKey() {
    return { key_id: process.env.RAZ_KEY_ID };
  }
}

export default new PaymentService();
