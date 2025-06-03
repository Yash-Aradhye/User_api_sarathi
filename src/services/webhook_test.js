// import crypto from 'crypto';

// // Step 1: Define your Razorpay webhook secret
// const secret = 'your_test_webhook_secret';

// // Step 2: Sample payload with emoji (like one from Razorpay)
// const testEvent = {"entity":"event","account_id":"acc_I2tZpX8ivNcXI1","event":"payment.captured","contains":["payment"],"payload":{"payment":{"entity":{"id":"pay_QbAN3ahvZZGcV1","entity":"payment","amount":716418,"currency":"INR","base_amount":716418,"status":"captured","order_id":"order_QbAAX4SKAX3e33","invoice_id":null,"international":false,"method":"upi","amount_refunded":0,"amount_transferred":0,"refund_status":null,"captured":true,"description":"Payment for Saarthi PLUS ➕ Plan","card_id":null,"bank":null,"wallet":null,"vpa":"9881471638snehal@ybl","email":"snehaljoshi0607@gmail.com","contact":"+919881471638","notes":{"customerPlan":"Saarthi PLUS ➕","planDetails":"{\"isPremium\":true,\"plan\":\"Saarthi PLUS ➕\",\"price\":\"6,999\",\"expiry\":60,\"form\":\"63e53\"}","planTitle":"Saarthi PLUS ➕","userPhone":"9881471638"},"fee":16518,"tax":2520,"error_code":null,"error_description":null,"error_source":null,"error_step":null,"error_reason":null,"acquirer_data":{"rrn":"860601840097"},"created_at":1748613759,"provider":null,"upi":{"payer_account_type":"bank_account","vpa":"9881471638snehal@ybl"},"reward":null}}},"created_at":1748613771}

// // Step 3: Simulate Razorpay sending raw JSON string body
// const rawBody = JSON.stringify(testEvent);

// // Step 4: Generate Razorpay-style HMAC signature
// const signature = crypto
//   .createHmac('sha256', secret)
//   .update(rawBody)
//   .digest('hex');

// export const generateSignature = (body, secret = 'your_test_webhook_secret') => {
//   return crypto
//     .createHmac('sha256', secret)
//     .update(body, 'utf8') // Ensure body is treated as UTF-8 string
//     .digest('hex');
// }

// const verifySignature = (body, signature, secret) => {
//   const expectedSignature = generateSignature(body, secret);
//   return expectedSignature === signature;
// }

// // Step 5: Print rawBody and signature
// const main = () => {
//   console.log("📦 Raw Body:\n", rawBody);
//   console.log("\n🔐 Simulated Razorpay Signature:\n", signature);
// };

