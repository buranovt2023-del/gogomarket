
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Loading } from '@/components/loading';

export default function SellerDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/seller/dashboard');
      return;
    }

    if (status === 'authenticated' && (session?.user as any)?.role !== 'SELLER') {
      router.replace('/');
      return;
    }

    if (status === 'authenticated') {
      loadStats();
    }
  }, [status, session, router]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/seller/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return <Loading />;
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-[#FF6B00]',
    },
    {
      title: 'Seller Rating',
      value: (stats?.rating || 0).toFixed(1),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {stats?.businessName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/seller/products"
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <Package className="h-8 w-8 text-[#FF6B00] mb-3" />
            <h3 className="font-semibold text-lg mb-2">Manage Products</h3>
            <p className="text-sm text-gray-600">
              Add, edit, or remove your products
            </p>
          </Link>

          <Link
            href="/seller/orders"
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <ShoppingCart className="h-8 w-8 text-[#FF6B00] mb-3" />
            <h3 className="font-semibold text-lg mb-2">View Orders</h3>
            <p className="text-sm text-gray-600">
              Track and manage your orders
            </p>
          </Link>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <TrendingUp className="h-8 w-8 text-[#FF6B00] mb-3" />
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">
              Coming soon - View detailed analytics
            </p>
          </div>
        </div>

        {/* Product Status */}
        {stats?.productStats && stats.productStats.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Product Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.productStats.map((stat: any) => (
                <div key={stat.status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{stat._count}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
