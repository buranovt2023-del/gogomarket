
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Search, User, Menu, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { data: session, status } = useSession() || {};
  const [cartCount, setCartCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'BUYER') {
      fetch('/api/cart')
        .then((res) => res.json())
        .then((data) => setCartCount(data?.length || 0))
        .catch(() => setCartCount(0));
    }
  }, [session]);

  const userRole = session?.user ? (session.user as any).role : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-black">GOGO</span>
              <span className="text-[#FF6B00]">MARKET</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form action="/products" method="GET" className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : session?.user ? (
              <>
                {userRole === 'BUYER' && (
                  <Link
                    href="/cart"
                    className="relative p-2 text-gray-700 hover:text-[#FF6B00] transition-colors"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-6 w-6 text-gray-700" />
                    <span className="hidden md:block text-sm font-medium">
                      {session.user.name || 'Account'}
                    </span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                        <p className="text-xs text-[#FF6B00] mt-1 font-medium uppercase">{userRole}</p>
                      </div>

                      {userRole === 'BUYER' && (
                        <>
                          <Link
                            href="/buyer/orders"
                            className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setShowMenu(false)}
                          >
                            <Package className="h-4 w-4 mr-3" />
                            My Orders
                          </Link>
                          <Link
                            href="/buyer/profile"
                            className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setShowMenu(false)}
                          >
                            <User className="h-4 w-4 mr-3" />
                            Profile
                          </Link>
                        </>
                      )}

                      {userRole === 'SELLER' && (
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3" />
                          Seller Dashboard
                        </Link>
                      )}

                      {userRole === 'ADMIN' && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6B00] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55E00] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
