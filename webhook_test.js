// Test script for webhook body processing
// Run this on both AWS Node.js and Windows environments

const testWebhookBody = {
  "entity": "event",
  "account_id": "acc_I2tZpX8ivNcXI1",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_QbAN3ahvZZGcV1",
        "entity": "payment",
        "amount": 716418,
        "currency": "INR",
        "base_amount": 716418,
        "status": "captured",
        "order_id": "order_QbAAX4SKAX3e33",
        "invoice_id": null,
        "international": false,
        "method": "upi",
        "amount_refunded": 0,
        "amount_transferred": 0,
        "refund_status": null,
        "captured": true,
        "description": "Payment for Saarthi PLUS ➕ Plan",
        "card_id": null,
        "bank": null,
        "wallet": null,
        "vpa": "9881471638snehal@ybl",
        "email": "snehaljoshi0607@gmail.com",
        "contact": "+919881471638",
        "notes": {
          "customerPlan": "Saarthi PLUS ➕",
          "planDetails": "{\"isPremium\":true,\"plan\":\"Saarthi PLUS ➕\",\"price\":\"6,999\",\"expiry\":60,\"form\":\"63e53\"}",
          "planTitle": "Saarthi PLUS ➕",
          "userPhone": "9881471638"
        },
        "fee": 16518,
        "tax": 2520,
        "error_code": null,
        "error_description": null,
        "error_source": null,
        "error_step": null,
        "error_reason": null,
        "acquirer_data": {
          "rrn": "860601840097"
        },
        "created_at": 1748613759,
        "provider": null,
        "upi": {
          "payer_account_type": "bank_account",
          "vpa": "9881471638snehal@ybl"
        },
        "reward": null
      }
    }
  },
  "created_at": 1748613771
};

console.log('=== WEBHOOK BODY TESTS ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('');

// Test 1: Basic structure access
console.log('1. BASIC STRUCTURE ACCESS:');
console.log('Event type:', testWebhookBody.event);
console.log('Payment ID:', testWebhookBody.payload.payment.entity.id);
console.log('Order ID:', testWebhookBody.payload.payment.entity.order_id);
console.log('');

// Test 2: Emoji handling in description
console.log('2. EMOJI IN DESCRIPTION:');
const description = testWebhookBody.payload.payment.entity.description;
console.log('Description:', description);
console.log('Description length:', description.length);
console.log('Description as bytes:', Buffer.from(description, 'utf8'));
console.log('Contains ➕?', description.includes('➕'));
console.log('');

// Test 3: Emoji handling in notes
console.log('3. EMOJI IN NOTES:');
const notes = testWebhookBody.payload.payment.entity.notes;
console.log('Customer Plan:', notes.customerPlan);
console.log('Plan Title:', notes.planTitle);
console.log('Customer Plan as bytes:', Buffer.from(notes.customerPlan, 'utf8'));
console.log('');

// Test 4: JSON parsing of planDetails
console.log('4. JSON PARSING TEST:');
const planDetailsString = notes.planDetails;
console.log('Raw planDetails string:', planDetailsString);
console.log('planDetails string length:', planDetailsString.length);

try {
  const parsedPlanDetails = JSON.parse(planDetailsString);
  console.log('✅ JSON parsing successful:');
  console.log('Parsed object:', parsedPlanDetails);
  console.log('Plan from parsed:', parsedPlanDetails.plan);
  console.log('Plan contains emoji?', parsedPlanDetails.plan.includes('➕'));
} catch (error) {
  console.log('❌ JSON parsing failed:');
  console.log('Error:', error.message);
  console.log('Error stack:', error.stack);
}
console.log('');

// Test 5: String operations with emojis
console.log('5. STRING OPERATIONS WITH EMOJIS:');
const planName = "Saarthi PLUS ➕";
console.log('Original plan name:', planName);
console.log('Plan name length:', planName.length);
console.log('Plan name as array:', [...planName]);
console.log('Emoji removal test:', planName.replace(/➕/g, 'PLUS'));
console.log('Unicode escape test:', planName.replace(/[\u2795]/g, 'PLUS'));
console.log('');

// Test 6: JSON stringify and parse roundtrip
console.log('6. JSON ROUNDTRIP TEST:');
try {
  const stringified = JSON.stringify(testWebhookBody);
  const parsed = JSON.parse(stringified);
  console.log('✅ JSON roundtrip successful');
  console.log('Roundtrip plan title:', parsed.payload.payment.entity.notes.planTitle);
} catch (error) {
  console.log('❌ JSON roundtrip failed:');
  console.log('Error:', error.message);
}
console.log('');

// Test 7: Character encoding tests
console.log('7. CHARACTER ENCODING TESTS:');
const emojiChar = '➕';
console.log('Emoji character:', emojiChar);
console.log('Emoji Unicode code point:', emojiChar.codePointAt(0));
console.log('Emoji as hex:', emojiChar.codePointAt(0).toString(16));
console.log('Emoji UTF-8 bytes:', Buffer.from(emojiChar, 'utf8'));
console.log('Emoji UTF-16 length:', emojiChar.length);
console.log('');

// Test 8: Simulate webhook processing logic
console.log('8. SIMULATE WEBHOOK PROCESSING:');
try {
  const payment = testWebhookBody.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  
  console.log('Extracted order ID:', orderId);
  console.log('Extracted payment ID:', paymentId);
  
  // Simulate finding order
  const order = {
    orderId: orderId,
    notes: payment.notes
  };
  
  const planDetails = JSON.parse(order.notes?.planDetails ?? '{}');
  console.log('✅ Plan details parsing in context successful:', planDetails);
  
  if (planDetails) {
    const premiumPlan = {
      planTitle: planDetails.plan ?? "Saarathi",
      purchasedDate: new Date(),
      form: planDetails.form ?? "Sarathi-Online",
      expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    };
    
    console.log('✅ Premium plan object created:', premiumPlan);
  }
} catch (error) {
  console.log('❌ Webhook processing simulation failed:');
  console.log('Error:', error.message);
  console.log('Stack:', error.stack);
}

console.log('');
console.log('=== TEST COMPLETE ===');