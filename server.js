const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
require('dotenv').config();

// Email service (optional - install with: npm install nodemailer)
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('Nodemailer not installed - email confirmations disabled');
}

const app = express();
// Use environment variables for security
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// Middleware
app.use(cors());
app.use(express.json());

// Product catalog - matches your frontend products
const PRODUCTS = {
  1: {
    id: 1,
    name: "Anua Heartleaf Pore Deep Cleansing Foam",
    price: 16.99,
    currency: "eur"
  }
  // Add more products as you expand
};

// Validate cart items and calculate total
function validateAndCalculateCart(cartItems) {
  let total = 0;
  const validatedItems = [];

  for (const item of cartItems) {
    const product = PRODUCTS[item.id];
    if (!product) {
      throw new Error(`Product with ID ${item.id} not found`);
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for product ${item.id}`);
    }

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    validatedItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      total: itemTotal
    });
  }

  return {
    items: validatedItems,
    total: Math.round(total * 100), // Convert to cents for Stripe
    currency: 'eur'
  };
}

// Create Payment Intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { cartItems, customerInfo } = req.body;

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ 
        error: 'Cart items are required and must be a non-empty array' 
      });
    }

    // Calculate total from backend (security: never trust frontend totals)
    const calculation = validateAndCalculateCart(cartItems);

    // Create Payment Intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: calculation.total,
      currency: calculation.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerInfo?.email || '',
        customerName: customerInfo?.name || '',
        orderItems: JSON.stringify(calculation.items)
      }
    });

    console.log(`Payment Intent created: ${paymentIntent.id} for €${calculation.total / 100}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: calculation.total,
      currency: calculation.currency,
      items: calculation.items
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Confirm payment webhook (optional but recommended)
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    
    // Here you would:
    // - Send confirmation email
    // - Update inventory
    // - Create order in database
    // - etc.
  }

  res.json({received: true});
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 LuxeSkin Backend running on port ${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api`);
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured'}`);
});
