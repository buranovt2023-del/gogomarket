
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    rating: number;
    reviewCount: number;
    images?: { url: string; altText?: string | null }[];
    seller?: {
      businessName: string;
      rating: number;
    };
  };
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const imageUrl = product.images?.[0]?.url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.images?.[0]?.altText || product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-[#FF6B00] text-white px-2 py-1 rounded text-xs font-bold">
              -{discount}%
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#FF6B00] transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.seller && (
          <p className="text-xs text-gray-500">{product.seller.businessName}</p>
        )}

        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price?.toFixed(2) || '0.00'}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {onAddToCart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product.id);
              }}
              className="p-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55E00] transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
