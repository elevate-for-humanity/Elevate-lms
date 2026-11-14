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

const fs = require('fs');
const path = require('path');

// Stripe Products Creator for Emergency Sale
class StripeProductsCreator {
  constructor() {
    this.stripe = null;
    this.products = [];
    this.init();
  }

  async init() {
    try {
      // Try to initialize Stripe
      this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');
    } catch (error) {
      this.mockMode = true;
    }
  }

  async createEmergencySaleProducts() {
    const emergencyProducts = [
      {
        name: 'EFH Complete Workforce Platform',
        description:
          '33+ certification programs, federal partnerships, LMS, revenue sharing system',
        price: 299900, // $2,999
        originalPrice: 999900, // $9,999
        features: [
          'Complete source code',
          'Federal WIOA partnerships',
          'Revenue-sharing system',
          'Google Career Certificates',
          'CompTIA certification prep',
          'Beauty & health programs',
          'Admin dashboard',
          'Payment processing',
          'LMS with content library',
          'SMS alert system',
        ],
      },
      {
        name: 'EFH Source Code Only',
        description: 'Complete codebase without partnerships',
        price: 99900, // $999
        originalPrice: 499900, // $4,999
        features: [
          'Full source code',
          'All 33+ programs',
          'Payment system',
          'Admin dashboard',
          'Documentation',
        ],
      },
      {
        name: 'EFH Federal Partnerships',
        description: 'Access to WIOA contracts and federal funding streams',
        price: 199900, // $1,999
        originalPrice: 599900, // $5,999
        features: [
          'WIOA contract templates',
          'Federal partnership docs',
          'ETPL approval process',
          'Case manager system',
          'Compliance reporting',
        ],
      },
    ];

    const createdProducts = [];

    for (const product of emergencyProducts) {
      try {
        const created = await this.createProduct(product);
        createdProducts.push(created);
      } catch (error) {}
    }

    // Save product data
    fs.writeFileSync(
      path.join(__dirname, 'emergency-sale-products.json'),
      JSON.stringify(createdProducts, null, 2),
    );

    return createdProducts;
  }

  async createProduct(productData) {
    if (this.mockMode) {
      // Mock product creation
      const mockProduct = {
        id: `prod_mock_${Date.now()}`,
        name: productData.name,
        description: productData.description,
        default_price: {
          id: `price_mock_${Date.now()}`,
          unit_amount: productData.price,
          currency: 'usd',
        },
        features: productData.features,
        metadata: {
          original_price: productData.originalPrice,
          emergency_sale: 'true',
          created_at: new Date().toISOString(),
        },
      };
      return mockProduct;
    }

    // Create actual Stripe product
    const stripeProduct = await this.stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: {
        original_price: productData.originalPrice.toString(),
        emergency_sale: 'true',
        features: JSON.stringify(productData.features),
      },
    });

    // Create price
    const stripePrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: productData.price,
      currency: 'usd',
    });

    return {
      ...stripeProduct,
      default_price: stripePrice,
      features: productData.features,
    };
  }

  async createCheckoutSession(productId, successUrl, cancelUrl) {
    if (this.mockMode) {
      return {
        url: `${successUrl}?session_id=mock_session_${Date.now()}`,
        id: `cs_mock_${Date.now()}`,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: productId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        emergency_sale: 'true',
      },
    });

    return session;
  }

  // Setup Express routes
  setupExpressRoutes(app) {
    // Create emergency sale products
    app.post('/api/stripe/create-emergency-products', async (req, res) => {
      try {
        const products = await this.createEmergencySaleProducts();
        res.json({ success: true, products });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create checkout session
    app.post('/api/stripe/create-checkout', async (req, res) => {
      try {
        const { productId, successUrl, cancelUrl } = req.body;
        const session = await this.createCheckoutSession(productId, successUrl, cancelUrl);
        res.json({ url: session.url, sessionId: session.id });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get emergency sale products
    app.get('/api/stripe/emergency-products', (req, res) => {
      try {
        const productsFile = path.join(__dirname, 'emergency-sale-products.json');
        if (fs.existsSync(productsFile)) {
          const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
          res.json({ products });
        } else {
          res.json({ products: [] });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}

// Export singleton instance
module.exports = new StripeProductsCreator();
