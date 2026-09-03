/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Webhook Handler for Payment Processing with Revenue Splits
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentProcessor = require('./payment-processing-with-splits');

const app = express();
const paymentProcessor = new PaymentProcessor();

// Webhook endpoint
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent
        );
        await paymentProcessor.handleSuccessfulPayment(paymentIntent);
        break;
      }
      case 'payment_intent.succeeded': {
        const payment = event.data.object;
          `💰 Payment succeeded: ${payment.id} - $${payment.amount / 100}`
        );
        if (!payment.metadata.processed) {
          await paymentProcessor.handleSuccessfulPayment(payment);
        }
        break;
      }
      case 'transfer.created': {
        const transfer = event.data.object;
          `📤 Transfer created: $${transfer.amount / 100} to ${transfer.destination}`
        );
        break;
      }
      default: {
      }
    }

    response.json({ received: true });
  }
);

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhook_endpoint: '/webhook',
  });
});

const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
});

module.exports = app;
