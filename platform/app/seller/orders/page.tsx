
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Loading } from '@/components/loading';

export default function SellerOrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/seller/orders');
      return;
    }

    if (status === 'authenticated' && (session?.user as any)?.role !== 'SELLER') {
      router.replace('/');
      return;
    }

    if (status === 'authenticated') {
      loadOrders();
    }
  }, [status, session, router]);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return <Loading />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'text-green-600 bg-green-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'SHIPPED':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">Orders will appear here once customers place them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-semibold">{order.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-[#FF6B00]">
                        ${order.total?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="font-medium text-sm">{order.status}</span>
                  </div>
                </div>

                {/* Order Items (only seller's products) */}
                <div className="p-6 space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            item.product?.images?.[0]?.url ||
                            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'
                          }
                          alt={item.product?.title || 'Product'}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.product?.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity} × ${item.price?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">${item.total?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-sm">
                    {order.address?.fullName} - {order.address?.phone}
                  </p>
                  <p className="text-sm">
                    {order.address?.street}, {order.address?.city}, {order.address?.state}{' '}
                    {order.address?.zipCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
