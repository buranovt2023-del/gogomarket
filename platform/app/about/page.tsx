import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-[#FF6B00] hover:text-[#E55E00] mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-6">About <span className="text-[#FF6B00]">GOGOMARKET</span></h1>
          
          <div className="space-y-6 text-gray-600">
            <p className="text-lg">
              Welcome to GOGOMARKET - your trusted online marketplace connecting buyers and sellers worldwide.
            </p>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
              <p>
                We strive to create a secure, user-friendly platform where anyone can buy or sell quality products
                with confidence. Our mission is to empower entrepreneurs and provide shoppers with access to a wide
                variety of products at competitive prices.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Why Choose Us?</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Wide selection of products from verified sellers</li>
                <li>Secure payment processing and buyer protection</li>
                <li>Easy-to-use seller tools for managing your business</li>
                <li>Responsive customer support</li>
                <li>Fast and reliable shipping options</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Join Our Community</h2>
              <p>
                Whether you are looking to shop for great deals or start your own online business,
                GOGOMARKET is here to support you every step of the way.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t">
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-[#FF6B00] text-white rounded-lg font-semibold hover:bg-[#E55E00] transition-colors mr-4"
            >
              Start Shopping
            </Link>
            <Link
              href="/auth/signup?role=seller"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
