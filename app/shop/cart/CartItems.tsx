'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

interface CartItemProps {
  items: Array<{
    cart_item_id: string;
    product_id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
}

export default function CartItems({ items }: CartItemProps) {
  const router = useRouter();

  const updateQuantity = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    const supabase = createClient();
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', cartItemId);
    router.refresh();
  };

  const removeItem = async (cartItemId: string) => {
    const supabase = createClient();
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.cart_item_id} className="p-6">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                  </div>
                  <button onClick={() => removeItem(item.cart_item_id)} className="text-gray-400 hover:text-brand-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
