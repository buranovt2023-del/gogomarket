
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Shield, Truck, Star } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        featured: true,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        seller: true,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      take: 6,
      orderBy: { order: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF6B00] to-[#E55E00] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Discover Amazing Products at{' '}
              <span className="text-black">GOGOMARKET</span>
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Shop from thousands of verified sellers and enjoy great deals on quality products.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-white text-[#FF6B00] rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/signup?role=seller"
                className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#FF6B00]/10 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Wide Selection</h3>
                <p className="text-sm text-gray-600">Thousands of products to choose from</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#FF6B00]/10 rounded-lg">
                <Shield className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Shopping</h3>
                <p className="text-sm text-gray-600">Safe and secure transactions</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#FF6B00]/10 rounded-lg">
                <Truck className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fast Delivery</h3>
                <p className="text-sm text-gray-600">Quick and reliable shipping</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#FF6B00]/10 rounded-lg">
                <Star className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Verified Sellers</h3>
                <p className="text-sm text-gray-600">Shop with confidence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Shop by Category</h2>
              <Link
                href="/products"
                className="text-[#FF6B00] hover:text-[#E55E00] font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="p-6 bg-white rounded-lg border border-gray-200 hover:border-[#FF6B00] hover:shadow-md transition-all text-center group"
                >
                  <h3 className="font-semibold group-hover:text-[#FF6B00] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {category._count?.products || 0} items
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <Link
                href="/products?featured=true"
                className="text-[#FF6B00] hover:text-[#E55E00] font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Selling on <span className="text-[#FF6B00]">GOGOMARKET</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of successful sellers and reach millions of potential customers
          </p>
          <Link
            href="/auth/signup?role=seller"
            className="inline-flex items-center px-8 py-4 bg-[#FF6B00] text-white rounded-lg font-semibold hover:bg-[#E55E00] transition-colors"
          >
            Become a Seller Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
