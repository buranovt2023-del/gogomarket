
import { PrismaClient, UserRole, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user (test account)
  const adminPassword = await bcrypt.hash('johndoe123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create seller user
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@gogomarket.com' },
    update: {},
    create: {
      email: 'seller@gogomarket.com',
      name: 'Demo Seller',
      password: sellerPassword,
      role: UserRole.SELLER,
      emailVerified: new Date(),
      phone: '+1234567890',
      phoneVerified: true,
    },
  });
  console.log('✅ Seller user created:', seller.email);

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      businessName: 'Demo Electronics Store',
      description: 'Your trusted source for quality electronics and gadgets',
      verified: true,
      rating: 4.8,
      totalSales: 150,
      totalRevenue: 45000,
    },
  });
  console.log('✅ Seller profile created:', sellerProfile.businessName);

  // Create buyer user
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@gogomarket.com' },
    update: {},
    create: {
      email: 'buyer@gogomarket.com',
      name: 'Demo Buyer',
      password: buyerPassword,
      role: UserRole.BUYER,
      emailVerified: new Date(),
      phone: '+1987654321',
      phoneVerified: true,
    },
  });
  console.log('✅ Buyer user created:', buyer.email);

  // Create buyer address
  const address = await prisma.address.create({
    data: {
      userId: buyer.id,
      fullName: 'Demo Buyer',
      phone: '+1987654321',
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      isDefault: true,
    },
  });
  console.log('✅ Buyer address created');

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      order: 1,
    },
  });

  const smartphones = await prisma.category.create({
    data: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Latest smartphones and mobile devices',
      parentId: electronics.id,
      isActive: true,
      order: 1,
    },
  });

  const laptops = await prisma.category.create({
    data: {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and notebooks',
      parentId: electronics.id,
      isActive: true,
      order: 2,
    },
  });

  const fashion = await prisma.category.create({
    data: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      isActive: true,
      order: 2,
    },
  });

  const home = await prisma.category.create({
    data: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor, furniture, and garden supplies',
      isActive: true,
      order: 3,
    },
  });

  console.log('✅ Categories created');

  // Create products with images
  const products = [
    {
      sellerId: sellerProfile.id,
      categoryId: smartphones.id,
      title: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features include ProMotion display, all-day battery life, and 5G connectivity.',
      price: 1199.99,
      compareAtPrice: 1299.99,
      stock: 25,
      sku: 'IP15PM256',
      status: ProductStatus.APPROVED,
      featured: true,
      rating: 4.8,
      reviewCount: 127,
      soldCount: 89,
      views: 1543,
      images: {
        create: [
          { url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Front_of_iPhone_15_Pro_Max.jpg', altText: 'iPhone 15 Pro Max front view', order: 0 },
          { url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Back_view_of_iPhone_15_Pro_Max_Natural_Titanium.jpg', altText: 'iPhone 15 Pro Max back view', order: 1 },
        ],
      },
    },
    {
      sellerId: sellerProfile.id,
      categoryId: smartphones.id,
      title: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Premium Android smartphone with 200MP camera, S Pen, and powerful performance. Includes Galaxy AI features for enhanced productivity.',
      price: 1099.99,
      stock: 30,
      sku: 'SGS24U',
      status: ProductStatus.APPROVED,
      featured: true,
      rating: 4.7,
      reviewCount: 98,
      soldCount: 72,
      views: 1234,
      images: {
        create: [
          { url: 'https://i.ytimg.com/vi/5PFp7c8lc6o/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDx67Eys4b-3Bqy3hZhTpSlpN-AdQ', altText: 'Samsung Galaxy S24 Ultra', order: 0 },
        ],
      },
    },
    {
      sellerId: sellerProfile.id,
      categoryId: laptops.id,
      title: 'MacBook Pro 14" M3 Pro',
      slug: 'macbook-pro-14-m3-pro',
      description: 'Powerful laptop for professionals with M3 Pro chip, stunning Liquid Retina XDR display, and up to 18 hours battery life.',
      price: 1999.99,
      compareAtPrice: 2199.99,
      stock: 15,
      sku: 'MBP14M3',
      status: ProductStatus.APPROVED,
      featured: true,
      rating: 4.9,
      reviewCount: 156,
      soldCount: 45,
      views: 2341,
      images: {
        create: [
          { url: 'https://i.ytimg.com/vi/-zxJBLNEj7w/sddefault.jpg', altText: 'MacBook Pro 14 inch', order: 0 },
        ],
      },
    },
    {
      sellerId: sellerProfile.id,
      categoryId: laptops.id,
      title: 'Dell XPS 15 Laptop',
      slug: 'dell-xps-15-laptop',
      description: 'Premium Windows laptop with Intel Core i7, 16GB RAM, 512GB SSD, and stunning 4K OLED display. Perfect for creators and professionals.',
      price: 1499.99,
      stock: 20,
      sku: 'DELLXPS15',
      status: ProductStatus.APPROVED,
      rating: 4.6,
      reviewCount: 87,
      soldCount: 56,
      views: 987,
      images: {
        create: [
          { url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&wid=3778&hei=2323&qlt=100,1&resMode=sharp2&size=3778,2323&chrss=full&imwidth=5000', altText: 'Dell XPS 15', order: 0 },
        ],
      },
    },
    {
      sellerId: sellerProfile.id,
      categoryId: smartphones.id,
      title: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      description: 'Google\'s flagship phone with advanced AI features, exceptional camera capabilities, and pure Android experience.',
      price: 899.99,
      stock: 35,
      sku: 'GP8PRO',
      status: ProductStatus.APPROVED,
      rating: 4.5,
      reviewCount: 64,
      soldCount: 43,
      views: 756,
      images: {
        create: [
          { url: 'https://i.ytimg.com/vi/otomCbnwsv0/maxresdefault.jpg', altText: 'Google Pixel 8 Pro', order: 0 },
        ],
      },
    },
    {
      sellerId: sellerProfile.id,
      categoryId: electronics.id,
      title: 'AirPods Pro 2nd Gen',
      slug: 'airpods-pro-2nd-gen',
      description: 'Premium wireless earbuds with active noise cancellation, spatial audio, and MagSafe charging case.',
      price: 249.99,
      stock: 50,
      sku: 'APP2',
      status: ProductStatus.APPROVED,
      featured: true,
      rating: 4.8,
      reviewCount: 234,
      soldCount: 178,
      views: 3456,
      images: {
        create: [
          { url: 'https://i.ytimg.com/vi/JBQvu6l-3e4/maxresdefault.jpg', altText: 'AirPods Pro 2nd Generation', order: 0 },
        ],
      },
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log('✅ Products created');

  // Create sample order
  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      addressId: address.id,
      orderNumber: 'ORD-' + Date.now(),
      status: 'DELIVERED',
      paymentMethod: 'CARD',
      paymentStatus: 'COMPLETED',
      subtotal: 1449.98,
      tax: 115.99,
      shippingCost: 0,
      discount: 0,
      total: 1565.97,
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { slug: 'airpods-pro-2nd-gen' } }))!.id,
            quantity: 2,
            price: 249.99,
            total: 499.98,
          },
          {
            productId: (await prisma.product.findFirst({ where: { slug: 'samsung-galaxy-s24-ultra' } }))!.id,
            quantity: 1,
            price: 1099.99,
            total: 1099.99,
          },
        ],
      },
    },
  });
  console.log('✅ Sample order created');

  console.log('🎉 Seeding completed!');
  console.log('\n📧 Test Accounts:');
  console.log('Admin: john@doe.com / johndoe123');
  console.log('Seller: seller@gogomarket.com / seller123');
  console.log('Buyer: buyer@gogomarket.com / buyer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
