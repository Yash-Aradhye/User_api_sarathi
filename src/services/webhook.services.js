import { db } from '../../config/firebase.js';
import nodemailer from '../utils/nodemailer.js';
import otpClient from '../utils/otpClient.js';

class WebhookService {
  constructor() {
    this.userCollection = db.collection('users');
    this.paymentLogsCollection = db.collection('paymentLogs');
  }
  
  async handlePaymentCaptured(event,payment) {
    try {
      const orderId = payment.order_id;
      const paymentId = payment.id;
      console.log('Payment captured:', payment);
      
      
      // Log payment event
      await this.logPaymentEvent(event, payment);
      
      // Find user with this order
      const usersSnapshot = await this.findUserWithOrder(orderId);
      
      if (usersSnapshot.empty) {
        throw new Error(`No user found with order ${orderId}`);
      }
      
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update the specific order in user's array
      const updatedOrders = userData.orders.map(order => {
        if (order.orderId === orderId) {
          return {
            ...order,
            paymentStatus: 'completed',
            paymentId: paymentId,
            paymentDetails: payment,
            updatedAt: new Date()
          };
        }
        return order;
      });
      
      // Check if this payment is for a premium plan upgrade
      const isPremiumPayment = userData.orders.some(order => 
        order.orderId === orderId && order.notes?.planDetails
      );
      
      const batch = db.batch();
      // Update user's order information
      batch.update(this.userCollection.doc(userDoc.id), {
        orders: updatedOrders
      });
      // If this is a premium plan payment, update user's premium status
      if (isPremiumPayment) {
        const order = userData.orders.find(o => o.orderId === orderId);
         const planDetails = JSON.parse(order.notes?.planDetails ?? '{}');
        
        if (planDetails) {
          const premiumPlan = {
            planTitle: planDetails.plan ?? "Saarathi",
            purchasedDate: new Date(),
            form: planDetails.form ?? "Sarathi-Online",
            //expiry after 4 months
            expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 4 months from now
          };
          
          batch.update(this.userCollection.doc(userDoc.id), {
            isPremium: true,
            premiumPlan
          });
        }
      }
      // Commit all updates
      await batch.commit();
      otpClient.sendSuccessSms(userData.phone);
      nodemailer.sendPaymentReceipt(userData.email, userData.name,  {
        ...payment,
        notes: userData.orders.find(order => order.orderId === orderId)?.notes || {}
      });
      return { success: true };
    } catch (error) {
      console.error('Error handling payment captured:', error);
      throw error;
    }
  }
  
  async handlePaymentFailed(event = 'payment.failed',payment) {
    try {
      const orderId = payment.order_id;
      
      // Log payment event
      await this.logPaymentEvent(event, payment);
      
      // Find user with this order
      const usersSnapshot = await this.findUserWithOrder(orderId);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        // Update the specific order in user's array
        const updatedOrders = userData.orders.map(order => {
          if (order.orderId === orderId) {
            return {
              ...order,
              paymentStatus: 'failed',
              paymentFailureDetails: payment,
              updatedAt: new Date()
            };
          }
          return order;
        });
        
        // Update user's order information
        await this.userCollection.doc(userDoc.id).update({
          orders: updatedOrders
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }
  
  async handleOrderPaid(event = 'order.paid', webhookData) {
    try {
      // Extract payment and order data from the webhook payload
      const payment = webhookData.payload.payment.entity;
      const order = webhookData.payload.order.entity;
      
      const orderId = order.id;
      const paymentId = payment.id;
      
      console.log('Order paid:', { orderId, paymentId, amount: payment.amount });
      
      // Log payment event
      await this.logPaymentEvent(event, { payment, order });
      
      // Find user with this order
      const usersSnapshot = await this.findUserWithOrder(orderId);
      
      if (usersSnapshot.empty) {
        throw new Error(`No user found with order ${orderId}`);
      }
      
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update the specific order in user's array
      const updatedOrders = userData.orders.map(orderItem => {
        if (orderItem.orderId === orderId) {
          return {
            ...orderItem,
            paymentStatus: 'completed',
            paymentId: paymentId,
            paymentDetails: payment,
            orderDetails: order,
            updatedAt: new Date()
          };
        }
        return orderItem;
      });
      
      // Check if this payment is for a premium plan upgrade
      const isPremiumPayment = userData.orders.some(orderItem => 
        orderItem.orderId === orderId && orderItem.notes?.planDetails
      );
      
      const batch = db.batch();
      
      // Update user's order information
      batch.update(this.userCollection.doc(userDoc.id), {
        orders: updatedOrders
      });
      
      // If this is a premium plan payment, update user's premium status
      if (isPremiumPayment) {
        const userOrder = userData.orders.find(o => o.orderId === orderId);
        const planDetails = JSON.parse(userOrder.notes?.planDetails ?? '{}');
        
        if (planDetails) {
          const premiumPlan = {
            planTitle: planDetails.plan ?? "Saarathi",
            purchasedDate: new Date(),
            form: planDetails.form ?? "Sarathi-Online",
            // Calculate expiry based on plan details (expiry is in days)
            expiryDate: new Date(Date.now() + (planDetails.expiry || 180) * 24 * 60 * 60 * 1000),
          };
          
          batch.update(this.userCollection.doc(userDoc.id), {
            isPremium: true,
            premiumPlan
          });
        }
      }
      
      // Commit all updates
      await batch.commit();
      
      // Send success SMS and email
      await otpClient.sendSuccessSms(userData.phone);
      await nodemailer.sendPaymentReceipt(userData.email, userData.name, {
        ...payment,
        notes: order.notes || {}
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error handling order paid:', error);
      throw error;
    }
  }

  async handleOrderCreated(order) {
    try {
      // Log order event
      await this.logPaymentEvent('order.created', order);
      // This is often redundant with payment.captured but can be used as a backup
      return { success: true };
    } catch (error) {
      console.error('Error handling order paid:', error);
      throw error;
    }
  }
  
  async handleRefundCreated(refund) {
    try {
      const paymentId = refund.payment_id;
      
      // Log refund event
      await this.logPaymentEvent('refund.created', refund);
      
      // Find user with this payment
      const usersSnapshot = await this.userCollection
        .where('orders', 'array-contains', {
          paymentId: paymentId
        })
        .get();
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        // Update order with refund information
        const updatedOrders = userData.orders.map(order => {
          if (order.paymentId === paymentId) {
            return {
              ...order,
              refundStatus: 'refunded',
              refundDetails: refund,
              refundedAt: new Date()
            };
          }
          return order;
        });
        
        // Update user document
        await this.userCollection.doc(userDoc.id).update({
          orders: updatedOrders
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling refund created:', error);
      throw error;
    }
  }


  
  async logPaymentEvent(eventType, data) {
    try {
      await this.paymentLogsCollection.add({
        eventType,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging payment event:', error);
    }
  }
  
  async findUserWithOrder(orderId) {
    try {
        // Try orderIds first (fastest for users with this field)
        let usersSnapshot = await this.userCollection
            .where('orderIds', 'array-contains', orderId)
            .get()
            .catch(() => ({ empty: true })); // Handle potential field doesn't exist error
        
        if (!usersSnapshot.empty) {
            return usersSnapshot;
        }
        
        // Fallback to currentOrderId
        usersSnapshot = await this.userCollection
            .where('currentOrderId', '==', orderId)
            .get();
        
        return usersSnapshot;
        
    } catch (error) {
        console.error('Find user with order error:', error);
        throw new Error('Failed to find user with order: ' + error.message);
    }
}
}

export default new WebhookService();
