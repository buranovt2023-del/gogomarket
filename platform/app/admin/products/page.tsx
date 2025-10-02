'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, Check, X, Trash2 } from 'lucide-react';
import { Loading } from '@/components/loading';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated') loadProducts();
  }, [status, session, router]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to load products');
      setProducts(await res.json());
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (productId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      setProducts(products.map((p) => (p.id === productId ? { ...p, status } : p)));
      toast.success(`Product ${status.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  if (loading || status === 'loading') return <Loading />;

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Package className="h-8 w-8 mr-3 text-[#FF6B00]" />
            Product Moderation
          </h1>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 flex-shrink-0">
                          <Image src={product.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={product.title} fill className="rounded object-cover" sizes="40px" />
                        </div>
                        <div className="ml-4 text-sm font-medium">{product.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{product.seller?.user?.name}</td>
                    <td className="px-6 py-4 text-sm">${product.price?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'APPROVED' ? 'bg-green-100 text-green-800' : product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {product.status !== 'APPROVED' && (
                          <button onClick={() => updateStatus(product.id, 'APPROVED')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        {product.status !== 'REJECTED' && (
                          <button onClick={() => updateStatus(product.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject">
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
