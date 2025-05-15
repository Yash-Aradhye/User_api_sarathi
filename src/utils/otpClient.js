import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class OtpClient {
  constructor() {
    this.apiUrl = 'https://www.bulksmsplans.com/api/send_sms';
    this.apiId = process.env.SMS_API_ID;
    this.apiPassword = process.env.SMS_API_PASSWORD;
    this.senderId = process.env.SMS_SENDER_ID || 'YASHCL';
    this.templateId = process.env.SMS_TEMPLATE_ID || '176983';
  }

  /**
   * Send SMS to a phone number
   * @param {string} phoneNumber - Phone number to send OTP (without country code)
   * @param {string} message - Message content (must contain the OTP)
   * @returns {Promise<Object>} - Response from the SMS API
   */
  async sendSms(phoneNumber, message) {
    try {
      if (!this.apiId || !this.apiPassword) {
        throw new Error('SMS API credentials not set in environment variables');
      }

      // Clean up the phone number (remove spaces, +, etc.)
      const cleanPhoneNumber = phoneNumber.toString().replace(/\D/g, '');

      const params = {
        api_id: this.apiId,
        api_password: this.apiPassword,
        sms_type: 'Transactional',
        sms_encoding: 'text',
        sender: this.senderId,
        number: cleanPhoneNumber,
        message: message,
        template_id: this.templateId
      };

      const response = await axios.get(this.apiUrl, { params });
      if(response) {
        console.log(response.data);
        
      }
      
      console.log(`SMS sent to ${cleanPhoneNumber}: ${message}`);
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Generate and send OTP
   * @param {string} phoneNumber - Phone number to send OTP
   * @returns {string} - Generated OTP
   */
  async sendOtp(phoneNumber) {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create message with OTP
    const message = `Your login OTP is ${otp}. Welcome to Saarthi by Yash Aradhye.`;
    
    try {
      if(phoneNumber == '1231231231' || phoneNumber == '1231231232') {
        console.log(`Test mode: OTP is 123456`);
        return '123456';
      }
      await this.sendSms(phoneNumber, message);
      return otp;
    } catch (error) {
      throw error;
    }
  }
}

export default new OtpClient();
