import { db } from '../../config/firebase.js';
import otpClient from '../utils/otpClient.js';

class WebhookService {
  constructor() {
    this.userCollection = db.collection('users');
    this.paymentLogsCollection = db.collection('paymentLogs');
  }
  
  async handlePaymentCaptured(payment) {
    try {
      const orderId = payment.order_id;
      const paymentId = payment.id;
      console.log('Payment captured:', payment);
      
      
      // Log payment event
      await this.logPaymentEvent('payment.captured', payment);
      
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
            planTitle: planDetails.plan ?? "Counselling",
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
      await otpClient.sendSuccessSms(userData.phone);
      return { success: true };
    } catch (error) {
      console.error('Error handling payment captured:', error);
      throw error;
    }
  }
  
  async handlePaymentFailed(payment) {
    try {
      const orderId = payment.order_id;
      
      // Log payment event
      await this.logPaymentEvent('payment.failed', payment);
      
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
  
  async handleOrderPaid(order) {
    try {
      // Log order event
      await this.logPaymentEvent('order.paid', order);
      
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
    // Query to find user with specific order ID
    // Note: This is a simplistic approach that might need refinement
    // based on how the orders are stored in user documents
    //orders is an array of objects in user document
    // [{ orderId: 'order_id', ...otherFields }]
    // This query assumes that the orderId is unique across all users
    // and that the orders field is an array of objects
    // containing orderId as a field.
    //make it more efficient by using array-contains
    // or array-contains-any if orderId is not unique across users

    const query = this.userCollection
      .where('currentOrderId', '==', orderId)
    const usersSnapshot = await query.get();

    return usersSnapshot;
  }
}

export default new WebhookService();
