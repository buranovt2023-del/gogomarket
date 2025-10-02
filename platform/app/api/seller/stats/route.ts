
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get product counts by status
    const productStats = await prisma.product.groupBy({
      by: ['status'],
      where: { sellerId: sellerProfile.id },
      _count: true,
    });

    // Get total products
    const totalProducts = await prisma.product.count({
      where: { sellerId: sellerProfile.id },
    });

    // Get orders with seller's products
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId: sellerProfile.id,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              sellerId: sellerProfile.id,
            },
          },
        },
      },
    });

    // Calculate revenue
    const totalRevenue = orders.reduce((sum: number, order: any) => {
      const sellerItems = order.items;
      return sum + sellerItems.reduce((itemSum: number, item: any) => itemSum + item.total, 0);
    }, 0);

    const { totalRevenue: _, ...profileData } = sellerProfile || {};
    
    return NextResponse.json({
      totalProducts,
      productStats,
      totalOrders: orders.length,
      totalRevenue,
      ...profileData,
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
