
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface AddToCartButtonProps {
  productId: string;
  inStock: boolean;
}

export default function AddToCartButton({ productId, inStock }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 401) {
          toast.error('Please login to add items to cart');
          setTimeout(() => router.push('/auth/login'), 1500);
          return;
        }
        throw new Error(error.error);
      }

      toast.success('Added to cart!');
      setTimeout(() => router.push('/cart'), 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            -
          </button>
          <span className="px-6 py-2 border-x">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || loading}
          className="flex-1 flex items-center justify-center px-8 py-3 bg-[#FF6B00] text-white rounded-lg font-semibold hover:bg-[#E55E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {loading ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </>
  );
}
