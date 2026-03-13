'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Heart,
  Sparkles,
  Star,
  ShoppingCart,
  Filter,
  Search,
  ArrowRight,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
  inStock: boolean;
  ingredients?: string;
}

const products: Product[] = [
  // Teas
  {
    id: 'vitality-cleanse-tea-5day',
    name: 'Meri-Gold-Round Vitality Cleanse Tea (5-Day)',
    description: 'Rejuvenate, detoxify, and energize naturally. 5-day cleanse supports digestion, liver and kidney function, metabolism, and mental clarity.',
    price: 24.99,
    category: 'Teas',
    badge: 'Signature',
    inStock: true,
    ingredients: 'Proprietary blend of fruits, flowers, roots, and botanicals',
  },
  {
    id: 'vitality-cleanse-tea-30day',
    name: 'Meri-Gold-Round Vitality Cleanse Tea (30-Day)',
    description: 'Full-body rejuvenation cleanse. Supports digestive health, immune function, skin radiance, metabolism, and sustained energy over 30 days.',
    price: 79.99,
    category: 'Teas',
    badge: 'Best Value',
    inStock: true,
    ingredients: 'Proprietary blend of fruits, flowers, roots, and botanicals',
  },
  {
    id: 'mint-glow-tea',
    name: 'Meri-Gold-Round Mint Glow Tea',
    description: 'A soothing spearmint-inspired herbal blend for full-body wellness. Refreshing mint, citrus, and vanilla notes for a smooth, spa-like taste you\'ll love drinking every day.',
    price: 18.99,
    category: 'Teas',
    badge: 'Best Seller',
    inStock: true,
    ingredients: 'Proprietary blend of mint, herbs, flowers, and natural botanicals',
  },
  // Body Butters
  {
    id: 'signature-wellness-butter',
    name: 'Meri-Gold-Round Signature Wellness Butter',
    description: 'Our flagship multi-purpose butter for hair growth, pain relief, skin firming, muscle recovery, and anti-aging. Handcrafted with 70+ premium ingredients.',
    price: 89.99,
    category: 'Butters',
    badge: 'Signature',
    inStock: true,
    ingredients: 'Aloe Vera, Argan Oil, Arnica Oil, Avocado Oil, Baobab Oil, Bearberry Oil, Bergamot Oil, Bhringraj Oil, Black Seed Oil, Brahmi Oil, Brazilian Buriti Oil, Camphor Oil, Capsicum Extract, Castor Oil, Cedarwood Oil, Clove Oil, Coconut Oil, Coffee Bean Oil, Copaiba Oil, Cypress Oil, Damiana Extract, Dipropylene Glycol, DMSO, Emu Oil, Eucalyptus Oil, Fish Oil, Frankincense Oil, Ginger Oil, Gotu Kola Extract, Hemp Seed Oil, Helichrysum Oil, Hyaluronic Acid, Jasmine Oil, Jojoba Oil, Lavender Oil, Liposomal Vitamin C, Magnesium Oil, Manuka Honey, Marula Oil, MCT Oil, Meadowfoam Seed Oil, Menthol Crystals, Mucuna Extract, Neem Oil, Niacinamide, Onion Seed Oil, Peppermint Oil, Polysorbate 80, Propylene Glycol, Psyllium Husk, Pumpkin Seed Oil, Rose Water, Rosehip Oil, Sandalwood Oil, Seaweed Extract, Shea Butter, Sodium Hydroxide, Squalane Oil, Stearic Acid, Stinging Nettle Extract, Sunflower Seed Oil, Sweet Almond Oil, Tea Tree Oil, Thyme Oil, Turmeric Oil, Turmeric Powder, Vitamin B12, Vitamin C Powder, Vitamin C Serum, Vitamin E, Wheat Protein, Wintergreen Oil',
  },
  {
    id: 'shea-body-butter',
    name: 'Meri-Gold-Round Shea Body Butter',
    description: 'Pure whipped shea butter for deep moisturizing and soft, hydrated skin.',
    price: 24.99,
    category: 'Butters',
    badge: 'Best Seller',
    inStock: true,
    ingredients: 'Coconut Oil, Shea Butter, Sweet Almond Oil, Vitamin E',
  },
  {
    id: 'mango-body-butter',
    name: 'Meri-Gold-Round Mango Body Butter',
    description: 'Whipped mango butter for lightweight moisture and soft, glowing skin.',
    price: 24.99,
    category: 'Butters',
    inStock: true,
    ingredients: 'Coconut Oil, Mango Butter, Sweet Almond Oil, Vitamin E',
  },
  {
    id: 'whipped-body-butter',
    name: 'Meri-Gold-Round Whipped Body Butter',
    description: 'Light, whipped formula with shea, cocoa, and coconut oils for everyday moisture.',
    price: 22.99,
    category: 'Butters',
    badge: 'Popular',
    inStock: true,
    ingredients: 'Cocoa Butter, Coconut Oil, Jojoba Oil, Shea Butter, Sweet Almond Oil, Vitamin E',
  },
  {
    id: 'soothing-body-butter',
    name: 'Meri-Gold-Round Soothing Body Butter',
    description: 'Calming blend with tea tree and eucalyptus for dry, irritated skin.',
    price: 28.99,
    category: 'Butters',
    inStock: true,
    ingredients: 'Aloe Vera, Arnica Oil, Coconut Oil, Eucalyptus Oil, Helichrysum Oil, Jojoba Oil, Lavender Oil, Shea Butter, Tea Tree Oil, Vitamin E',
  },
  // Oils
  {
    id: 'lavender-oil',
    name: 'Meri-Gold-Round Lavender Essential Oil',
    description: 'Pure lavender essential oil for relaxation, sleep support, and aromatherapy.',
    price: 14.99,
    category: 'Oils',
    badge: 'Best Seller',
    inStock: true,
  },
  {
    id: 'eucalyptus-oil',
    name: 'Meri-Gold-Round Eucalyptus Essential Oil',
    description: 'Refreshing eucalyptus oil for respiratory support and mental clarity.',
    price: 12.99,
    category: 'Oils',
    inStock: true,
  },
  {
    id: 'peppermint-oil',
    name: 'Meri-Gold-Round Peppermint Essential Oil',
    description: 'Invigorating peppermint oil for energy, focus, and headache relief.',
    price: 13.99,
    category: 'Oils',
    inStock: true,
  },
  {
    id: 'massage-oil',
    name: 'Meri-Gold-Round Relaxation Massage Oil',
    description: 'Blend of sweet almond, jojoba, and essential oils for soothing massage therapy.',
    price: 19.99,
    category: 'Oils',
    badge: 'Popular',
    inStock: true,
  },
  {
    id: 'body-oil',
    name: 'Meri-Gold-Round Glow Body Oil',
    description: 'Lightweight body oil with rosehip and vitamin E for radiant, hydrated skin.',
    price: 21.99,
    category: 'Oils',
    inStock: true,
  },
  {
    id: 'essential-oil-set',
    name: 'Meri-Gold-Round Essential Oil Set',
    description: 'Collection of 6 essential oils: lavender, eucalyptus, peppermint, tea tree, lemon, and orange.',
    price: 44.99,
    category: 'Oils',
    badge: 'Value Pack',
    inStock: true,
  },
  // Soaps
  {
    id: 'yoni-soap',
    name: 'Meri-Gold-Round Yoni Soap',
    description: 'Gentle, soothing intimate care soap with natural botanicals. Supports pH balance, provides antibacterial protection, and promotes skin healing for sensitive areas.',
    price: 12.00,
    category: 'Soaps',
    badge: 'Signature',
    inStock: true,
    ingredients: 'Aloe Vera Gel, Bentonite Clay, Calendula Petals, Chamomile Flowers, Coconut Oil, Glycerin Soap Base, Honey, Kaolin Clay, Lavender Essential Oil, Lavender Flowers, Rose Water, Sweet Almond Oil, Tea Tree Essential Oil',
  },
  {
    id: 'mens-intimate-soap',
    name: 'Meri-Gold-Round Men\'s Intimate Soap',
    description: 'Gentle cleansing soap for men. Deep cleanses, controls odor, soothes irritation, and keeps skin fresh and hydrated with cooling peppermint and tea tree.',
    price: 12.00,
    category: 'Soaps',
    badge: 'For Him',
    inStock: true,
    ingredients: 'Activated Charcoal Powder, Aloe Vera Gel, Calendula Oil, Chamomile Flowers, Cypress Essential Oil, Glycerin Soap Base, Honey, Oatmeal, Peppermint Essential Oil, Sweet Almond Oil, Tea Tree Essential Oil, Witch Hazel Extract',
  },
  {
    id: 'facial-bar-soap',
    name: 'Meri-Gold-Round Massaging Facial Bar',
    description: 'Brightening facial soap for hyperpigmentation and uneven skin tone. Gently exfoliates, reduces dark spots, and promotes a radiant, even complexion.',
    price: 12.00,
    category: 'Soaps',
    badge: 'New',
    inStock: true,
    ingredients: 'Aloe Vera Oil, Alpha Arbutin Powder, Bentonite Clay, Citric Acid, Glycerin Soap Base, Lactic Acid, Licorice Powder, Niacinamide (Vitamin B3), Vitamin C Powder (L-Ascorbic Acid)',
  },
  {
    id: 'lavender-soap',
    name: 'Meri-Gold-Round Lavender Bar Soap',
    description: 'Handcrafted soap with lavender essential oil and shea butter for gentle cleansing.',
    price: 12.00,
    category: 'Soaps',
    inStock: true,
    ingredients: 'Glycerin Soap Base, Lavender Essential Oil, Shea Butter, Vitamin E',
  },
  {
    id: 'charcoal-soap',
    name: 'Meri-Gold-Round Activated Charcoal Soap',
    description: 'Detoxifying charcoal soap to draw out impurities and deep clean pores.',
    price: 12.00,
    category: 'Soaps',
    badge: 'Best Seller',
    inStock: true,
    ingredients: 'Activated Charcoal, Coconut Oil, Glycerin Soap Base, Tea Tree Essential Oil, Vitamin E',
  },
  {
    id: 'oatmeal-soap',
    name: 'Meri-Gold-Round Oatmeal Honey Soap',
    description: 'Gentle exfoliating soap with colloidal oatmeal and raw honey for sensitive skin.',
    price: 12.00,
    category: 'Soaps',
    inStock: true,
    ingredients: 'Colloidal Oatmeal, Glycerin Soap Base, Honey, Shea Butter, Sweet Almond Oil, Vitamin E',
  },
  {
    id: 'tea-tree-soap',
    name: 'Meri-Gold-Round Tea Tree Soap',
    description: 'Antibacterial tea tree soap for acne-prone and oily skin.',
    price: 12.00,
    category: 'Soaps',
    badge: 'Popular',
    inStock: true,
    ingredients: 'Coconut Oil, Glycerin Soap Base, Jojoba Oil, Tea Tree Essential Oil, Vitamin E',
  },
  {
    id: 'rose-soap',
    name: 'Meri-Gold-Round Rose Petal Soap',
    description: 'Luxurious rose-scented soap with rose petals and moisturizing oils.',
    price: 12.00,
    category: 'Soaps',
    inStock: true,
    ingredients: 'Glycerin Soap Base, Rose Essential Oil, Rose Petals, Rose Water, Shea Butter, Sweet Almond Oil, Vitamin E',
  },
  {
    id: 'soap-gift-set',
    name: 'Meri-Gold-Round Soap Gift Set',
    description: 'Collection of 4 handcrafted soaps in a beautiful gift box. Perfect for gifting.',
    price: 44.00,
    category: 'Soaps',
    badge: 'Gift Set',
    inStock: true,
    ingredients: 'Assorted handcrafted soaps with natural ingredients',
  },
  // Universal Oil
  {
    id: 'universal-oil',
    name: 'Meri-Gold-Round Universal Oil',
    description: 'Multi-purpose oil for hair, scalp, body, and skin. Supports healthier-looking hair, soothes muscles, and enhances skin appearance with cooling and warming botanicals.',
    price: 34.99,
    category: 'Oils',
    badge: 'Signature',
    inStock: true,
    ingredients: 'Argan Oil, Arnica Extract, Bergamot Oil, Black Pepper Oil, Black Seed Oil, Camphor Oil, Castor Oil, Cedarwood Oil, Clary Sage Oil, Copaiba Oil, Eucalyptus Oil, Frankincense Oil, Geranium Oil, Ginger Oil, Grapefruit Oil, Hyaluronic Acid, Jojoba Oil, Lavender Oil, Maca Extract, MCT Oil, Menthol Crystals, Mucuna Extract, Peppermint Oil, Phosphatidylcholine, Pumpkin Seed Oil, Rosehip Oil, Rosemary Oil, Sandalwood Oil, Sweet Almond Oil, Thyme Oil, Volufiline, Wintergreen Oil',
  },
  {
    id: 'universal-oil-8oz',
    name: 'Meri-Gold-Round Universal Oil (8 oz)',
    description: 'Family size multi-purpose oil for daily use on hair, scalp, beard, body, and skin. Fast-absorbing with soothing aromatherapy benefits.',
    price: 59.99,
    category: 'Oils',
    badge: 'Value Size',
    inStock: true,
    ingredients: 'Argan Oil, Arnica Extract, Bergamot Oil, Black Pepper Oil, Black Seed Oil, Camphor Oil, Castor Oil, Cedarwood Oil, Clary Sage Oil, Copaiba Oil, Eucalyptus Oil, Frankincense Oil, Geranium Oil, Ginger Oil, Grapefruit Oil, Hyaluronic Acid, Jojoba Oil, Lavender Oil, Maca Extract, MCT Oil, Menthol Crystals, Mucuna Extract, Peppermint Oil, Phosphatidylcholine, Pumpkin Seed Oil, Rosehip Oil, Rosemary Oil, Sandalwood Oil, Sweet Almond Oil, Thyme Oil, Volufiline, Wintergreen Oil',
  },
  // King Greene Kids Line
  {
    id: 'king-greene-crown-butter',
    name: 'King Greene Calming Crown Butter',
    description: 'Kid-safe whipped butter for calming bedtime routines. Soothes scalp and nourishes growing crowns with gentle botanicals.',
    price: 18.99,
    category: 'Kids',
    badge: 'Kids Line',
    inStock: true,
    ingredients: 'Aloe Vera Oil, Ashwagandha Extract, Calendula Infused Oil, Chamomile Extract, Chebe Powder, Frankincense Essential Oil, Grapeseed Oil, Hyaluronic Acid, Lavender Essential Oil, Mango Butter, Shea Butter, Sweet Almond Oil, Vanilla Extract, Vetiver Essential Oil, Vitamin E Oil, Zinc Oxide',
  },
  {
    id: 'king-greene-bedtime-soap',
    name: 'King Greene Calming Bedtime Soap',
    description: 'Gentle cleansing soap with calming lavender and chamomile. Perfect for bath time wind-down routines.',
    price: 12.00,
    category: 'Kids',
    inStock: true,
    ingredients: 'Aloe Vera Gel, Calendula Petals, Chamomile Essential Oil, Glycerin Soap Base, Honey, Kaolin Clay, Lavender Essential Oil, Tea Tree Essential Oil',
  },
  {
    id: 'king-greene-calming-spray',
    name: 'King Greene Calming Spray',
    description: 'Soothing pillow and hair mist for peaceful sleep. Gentle aromatherapy blend safe for kids.',
    price: 14.99,
    category: 'Kids',
    inStock: true,
    ingredients: 'Aloe Vera Juice, Chamomile Extract, Frankincense Oil, Glycerin, Lavender Oil, Rose Water, Vetiver Oil, Vitamin E, Witch Hazel',
  },
  {
    id: 'king-greene-crown-oil',
    name: 'King Greene Kiddie Crown Hair Oil',
    description: 'Gentle daily oil for edges and scalp. Supports healthy hair growth with calming botanicals.',
    price: 16.99,
    category: 'Kids',
    badge: 'Best Seller',
    inStock: true,
    ingredients: 'Ashwagandha Glycerite, Baobab Oil, Calendula Oil, Chamomile Essential Oil, Chebe-Infused Oil, Grapeseed Oil, Jojoba Oil, Lavender Essential Oil, Vitamin E',
  },
  {
    id: 'king-greene-gummies',
    name: 'King Greene Crown Calm Gummies',
    description: 'Tasty focus and calm gummies for kids. Made with natural fruit juice and gentle botanicals. No melatonin.',
    price: 24.99,
    category: 'Kids',
    badge: 'Popular',
    inStock: true,
    ingredients: 'Ashwagandha Glycerite, Chamomile Glycerite, Citric Acid, Gelatin, Lemon Balm Glycerite, Lemon Juice, L-Theanine, Magnesium Glycinate, Organic Apple Juice, Raw Honey, Strawberry Flavor, Vitamin B6, Vitamin D3, Zinc Citrate',
  },
  {
    id: 'king-greene-shampoo',
    name: 'King Greene Gentle Crown Shampoo',
    description: 'Mild, tear-free shampoo for kids. Gentle cleansing with calming chamomile and lavender.',
    price: 14.99,
    category: 'Kids',
    inStock: true,
    ingredients: 'Aloe Vera Juice, Banana Extract, Calendula Extract, Castile Soap, Chamomile Essential Oil, Glycerin, Lavender Essential Oil',
  },
  {
    id: 'king-greene-conditioner',
    name: 'King Greene Moisturizing Conditioner',
    description: 'Creamy conditioner for soft, manageable hair. Makes detangling easy with gentle moisture.',
    price: 14.99,
    category: 'Kids',
    inStock: true,
    ingredients: 'Aloe Vera Juice, BTMS-50, Chamomile Essential Oil, Distilled Water, Lavender Essential Oil, Shea Butter, Sweet Almond Oil',
  },
  {
    id: 'king-greene-detangler',
    name: 'King Greene Detangling Spray',
    description: 'Leave-in detangler for knot-free hair. Works on wet or dry hair for easy styling.',
    price: 12.99,
    category: 'Kids',
    inStock: true,
    ingredients: 'Aloe Vera Juice, Glycerin, Lavender Oil, Marshmallow Root Extract, Slippery Elm Extract, Vitamin E',
  },
];

const categories = ['All', 'teas', 'butters', 'oils', 'soaps', 'kids'];
const categoryLabels: Record<string, string> = {
  'All': 'All',
  'teas': 'Teas',
  'butters': 'Butters',
  'kids': 'Kids',
  'oils': 'Oils',
  'soaps': 'Soaps',
};

function CheckoutButton({ cartTotal, itemCount }: { cartTotal: number; itemCount: number }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/curvature/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch (error) {
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || itemCount === 0}
      className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Checkout
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export default function CurvatureShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<string[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Fetch products from database
  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('category', ['teas', 'butters', 'oils', 'soaps'])
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (data && !error) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: parseFloat(p.price),
          category: p.category,
          image: p.image_url,
          badge: p.slug.includes('set') ? 'Value Pack' : p.slug.includes('gift') ? 'Gift Set' : undefined,
          inStock: true,
        }));
        setDbProducts(mapped);
      } else {
        // Fallback to static products if DB fails
        setDbProducts(products);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Use DB products if available, otherwise static
  const displayProducts = dbProducts.length > 0 ? dbProducts : products;

  const filteredProducts = displayProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = async (productId: string) => {
    setAddingToCart(productId);
    
    // Try to add to database cart
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('cart_items').upsert({
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      }, { onConflict: 'user_id,product_id' });
    }
    
    // Also update local state
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
    
    setAddingToCart(null);
  };

  const isInCart = (productId: string) => cart.includes(productId);

  const cartTotal = cart.reduce((total, id) => {
    const product = displayProducts.find(p => p.id === id);
    return total + (product?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/curvature-body-sculpting" className="text-pink-200 hover:text-white text-sm mb-2 inline-block">
                ← Back to Curvature Body Sculpting
              </Link>
              <h1 className="text-3xl font-bold">Meri-Gold-Round Wellness Shop</h1>
              <p className="text-pink-100 mt-2">Handcrafted teas, butters, oils, and soaps for mind, body, and spirit</p>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Cart ({cart.length})</span>
              </button>
              {cart.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white text-gray-900 rounded-lg shadow-xl p-4 z-10 hidden group-hover:block">
                  <p className="font-bold mb-2">{cart.length} item{cart.length > 1 ? 's' : ''}</p>
                  <div className="border-t border-gray-100 pt-2 mb-3">
                    {cart.slice(0, 3).map((id) => {
                      const product = displayProducts.find(p => p.id === id);
                      return product ? (
                        <div key={id} className="flex justify-between text-sm py-1">
                          <span className="truncate flex-1 pr-2">{product.name.replace('Meri-Gold-Round ', '')}</span>
                          <span className="text-gray-600">${product.price.toFixed(2)}</span>
                        </div>
                      ) : null;
                    })}
                    {cart.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">+{cart.length - 3} more items</p>
                    )}
                  </div>
                  <div className="border-t border-gray-200 pt-2 mb-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <CheckoutButton cartTotal={cartTotal} itemCount={cart.length} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">{filteredProducts.length} products</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <Sparkles className="w-16 h-16 text-purple-300 group-hover:scale-110 transition" />
                      )}
                      {product.badge && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full z-10">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="p-4">
                      <p className="text-xs text-purple-600 font-medium mb-1 capitalize">{product.category}</p>
                      <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      {product.ingredients && (
                        <details className="mb-3">
                          <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800 font-medium">
                            View Ingredients
                          </summary>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {product.ingredients}
                          </p>
                        </details>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={isInCart(product.id) || addingToCart === product.id}
                          className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition ${
                            isInCart(product.id)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {addingToCart === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isInCart(product.id) ? (
                            <>
                              <Check className="w-4 h-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Partnership Banner */}
      <section className="py-12 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Supporting Mental Wellness</h2>
          <p className="text-purple-200 mb-6">
            A portion of every purchase supports Selfish Inc. 501(c)(3) mental wellness programs 
            and free community services through VITA.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/nonprofit/mental-wellness"
              className="px-6 py-3 bg-white text-purple-900 font-medium rounded-lg hover:bg-purple-50 transition"
            >
              Learn About Selfish Inc.
            </Link>
            <Link
              href="/vita"
              className="px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition"
            >
              Free VITA Services
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions?</h2>
          <p className="text-gray-600 mb-6">
            Contact us at <a href="mailto:curvaturebodysculpting@gmail.com" className="text-purple-600 hover:underline">curvaturebodysculpting@gmail.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
