import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Create reusable transporter using SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Default sender info
    this.defaultFrom = process.env.EMAIL_FROM || '"Saarathi" <noreply@counsellingapp.com>';
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text body
   * @param {string} options.html - HTML body (optional)
   * @param {string} options.from - Sender email (optional, uses default if not provided)
   * @param {Array} options.attachments - Attachments (optional)
   * @returns {Promise<Object>} - Send mail response
   */
  async sendMail(options) {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send a welcome email to new users
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @returns {Promise<Object>} - Send mail response
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Counselling App';
    const text = `Hi ${name}, Welcome to Counselling App! We're glad to have you on board.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Welcome to Counselling App</h2>
        <p>Hi ${name},</p>
        <p>We're excited to have you join our platform. Here you'll find all the support and resources you need.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The Counselling App Team</p>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send a password reset email
   * @param {string} email - User's email
   * @param {string} resetLink - Password reset link
   * @returns {Promise<Object>} - Send mail response
   */
  async sendPasswordResetEmail(email, resetLink) {
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Click on this link to reset your password: ${resetLink}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password. Click the button below to proceed:</p>
        <p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br/>The Counselling App Team</p>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send an appointment confirmation email
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @param {Date} appointmentDate - Appointment date and time
   * @param {string} counsellorName - Counsellor's name
   * @returns {Promise<Object>} - Send mail response
   */
  async sendAppointmentConfirmation(email, name, appointmentDate, counsellorName) {
    const formattedDate = appointmentDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = 'Your Counselling Appointment Confirmation';
    const text = `Hi ${name}, Your counselling appointment with ${counsellorName} has been confirmed for ${formattedDate}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Appointment Confirmation</h2>
        <p>Hi ${name},</p>
        <p>Your counselling appointment has been confirmed:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50;">
          <p><strong>Date and Time:</strong> ${formattedDate}</p>
          <p><strong>Counsellor:</strong> ${counsellorName}</p>
        </div>
        <p>Please be available 5 minutes before your scheduled time.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        <p>Best regards,<br/>The Counselling App Team</p>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send payment receipt email
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} - Send mail response
   */
  async sendPaymentReceipt(email, name, paymentDetails) {
    const subject = 'Payment Receipt - Counselling App';
    const text = `Hi ${name}, Thank you for your payment of ₹${paymentDetails.amount}. Your transaction ID is ${paymentDetails.id}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Payment Receipt</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your payment. Here are the details:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50;">
          <p><strong>Amount:</strong> ₹${paymentDetails.amount}</p>
          <p><strong>Transaction ID:</strong> ${paymentDetails.id}</p>
          <p><strong>Date:</strong> ${new Date(paymentDetails.date).toLocaleDateString()}</p>
          <p><strong>Plan:</strong> ${paymentDetails.notes.planName}</p>
        </div>
        <p>If you have any questions about your payment, please contact our support team.</p>
        <p>Best regards,<br/>Yash Aradhye & Team</p>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }
}

new EmailService().sendWelcomeEmail('mayankmchandratre@gmail.com', 'Mayank Chandratre');

export default new EmailService();
