
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, Package } from 'lucide-react';
import { Loading } from '@/components/loading';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/checkout');
      return;
    }

    if (status === 'authenticated') {
      loadCheckoutData();
    }
  }, [status, router]);

  const loadCheckoutData = async () => {
    try {
      const [cartRes, addressRes] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/buyer/addresses'),
      ]);

      if (!cartRes.ok || !addressRes.ok) throw new Error('Failed to load data');

      const cartData = await cartRes.json();
      const addressData = await addressRes.json();

      setCartItems(cartData || []);
      setAddress(addressData?.find((a: any) => a.isDefault) || addressData?.[0] || null);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Please add a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: address.id,
          paymentMethod,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const order = await res.json();
      toast.success('Order placed successfully!');
      setTimeout(() => router.push(`/buyer/orders`), 1500);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || status === 'loading') {
    return <Loading />;
  }

  if (cartItems.length === 0) {
    router.replace('/cart');
    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#FF6B00]" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => router.push('/buyer/profile#addresses')}
                  className="text-[#FF6B00] hover:text-[#E55E00] text-sm font-medium"
                >
                  Change
                </button>
              </div>

              {address ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold">{address.fullName}</p>
                  <p className="text-gray-600 mt-1">{address.phone}</p>
                  <p className="text-gray-600 mt-1">
                    {address.street}, {address.city}, {address.state} {address.zipCode}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No delivery address found</p>
                  <button
                    onClick={() => router.push('/buyer/profile#addresses')}
                    className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55E00] transition-colors"
                  >
                    Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <CreditCard className="h-5 w-5 mr-2 text-[#FF6B00]" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive the order</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="CARD"
                    disabled
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Coming soon</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <Package className="h-5 w-5 mr-2 text-[#FF6B00]" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.title} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#FF6B00]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !address}
                className="w-full px-6 py-3 bg-[#FF6B00] text-white rounded-lg font-semibold hover:bg-[#E55E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
