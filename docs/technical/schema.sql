
-- GOGOMARKET Database Schema
-- PostgreSQL 14+
-- Version: 1.0.0
-- Created: October 2, 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User related enums
CREATE TYPE user_role_enum AS ENUM ('admin', 'buyer', 'seller', 'courier');
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'role_manager', 'accounting', 'technical_access');
CREATE TYPE address_type_enum AS ENUM ('delivery', 'billing');

-- Product related enums
CREATE TYPE product_status_enum AS ENUM ('draft', 'active', 'inactive', 'out_of_stock', 'discontinued');

-- Order related enums
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'gogomoney', 'bank_transfer');
CREATE TYPE tracking_status_enum AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');

-- Financial related enums
CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'withdrawal', 'purchase', 'refund', 'commission', 'payout', 'bonus');
CREATE TYPE commission_status_enum AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE payout_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE payout_method_enum AS ENUM ('bank_transfer', 'gogomoney', 'cash');

-- Social related enums
CREATE TYPE story_type_enum AS ENUM ('image', 'video');
CREATE TYPE chat_type_enum AS ENUM ('direct', 'group', 'support');
CREATE TYPE chat_role_enum AS ENUM ('admin', 'member');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'video', 'audio', 'file', 'location', 'product');

-- Notification related enums
CREATE TYPE notification_type_enum AS ENUM ('order', 'message', 'review', 'promotion', 'system', 'payment');

-- Dispute related enums
CREATE TYPE dispute_type_enum AS ENUM ('product_issue', 'delivery_issue', 'payment_issue', 'other');
CREATE TYPE dispute_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE return_status_enum AS ENUM ('requested', 'approved', 'rejected', 'in_transit', 'received', 'refunded');
CREATE TYPE return_condition_enum AS ENUM ('unopened', 'opened', 'used', 'damaged');
CREATE TYPE refund_method_enum AS ENUM ('original_payment', 'gogomoney', 'bank_transfer');

-- Promotion related enums
CREATE TYPE promo_type_enum AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE promo_applicable_enum AS ENUM ('all', 'category', 'product', 'seller');

-- System related enums
CREATE TYPE setting_type_enum AS ENUM ('string', 'number', 'boolean', 'json');

-- ============================================================================
-- CORE TABLES: Users and Authentication
-- ============================================================================

-- Users table: Primary user table for all platform participants
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role user_role_enum NOT NULL,
    status user_status_enum NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE users IS 'Primary user table for all platform participants (admin, buyer, seller, courier)';
COMMENT ON COLUMN users.uuid IS 'Universal unique identifier for distributed systems';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: admin, buyer, seller, or courier';

-- Admin roles: Granular permissions for admin users
CREATE TABLE admin_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type admin_role_enum NOT NULL,
    permissions JSONB NOT NULL,
    granted_by BIGINT REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_roles IS 'Granular admin permissions: super_admin, role_manager, accounting, technical_access';
COMMENT ON COLUMN admin_roles.permissions IS 'Detailed permissions object in JSON format';

-- User sessions: Active user sessions for authentication
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_sessions IS 'Active user sessions with JWT tokens';

-- User addresses: Delivery and billing addresses
CREATE TABLE user_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type address_type_enum NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    label VARCHAR(50),
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    street VARCHAR(255) NOT NULL,
    building VARCHAR(50),
    apartment VARCHAR(50),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    delivery_instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE user_addresses IS 'User delivery and billing addresses with GPS coordinates';

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Categories: Multi-level product categories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    image_url TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE categories IS 'Multi-level product category hierarchy';
COMMENT ON COLUMN categories.level IS 'Hierarchy level: 0 for root, 1 for subcategory, etc.';

-- Products: Main product table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    brand VARCHAR(100),
    base_price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    weight DECIMAL(10, 3),
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    status product_status_enum NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    allow_backorder BOOLEAN DEFAULT FALSE,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_price_positive CHECK (base_price >= 0),
    CONSTRAINT chk_sale_price CHECK (sale_price IS NULL OR sale_price >= 0),
    CONSTRAINT chk_rating CHECK (rating_average >= 0 AND rating_average <= 5)
);

COMMENT ON TABLE products IS 'Main product catalog with pricing, inventory, and SEO fields';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.cost_price IS 'Cost price for margin calculation';

-- Product images: Product image gallery
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_images IS 'Product image gallery with primary image flag';

-- Product variants: Product variations (size, color, etc.)
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE product_variants IS 'Product variations with attributes like color, size, material';
COMMENT ON COLUMN product_variants.attributes IS 'JSON object with variant attributes: {"color": "red", "size": "L"}';

-- Product attributes: Additional product specifications
CREATE TABLE product_attributes (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_attributes IS 'Product specifications and attributes';

-- ============================================================================
-- ORDERS AND TRANSACTIONS
-- ============================================================================

-- Orders: Main order table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    courier_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status order_status_enum NOT NULL DEFAULT 'pending',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method payment_method_enum NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    commission_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    promo_code_id BIGINT,
    delivery_address_id BIGINT NOT NULL,
    delivery_zone_id BIGINT,
    estimated_delivery_date DATE,
    actual_delivery_date TIMESTAMP,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by BIGINT REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT chk_amounts_positive CHECK (
        subtotal >= 0 AND 
        discount_amount >= 0 AND 
        tax_amount >= 0 AND 
        shipping_cost >= 0 AND 
        total_amount >= 0
    )
);

COMMENT ON TABLE orders IS 'Main order table with payment, delivery, and status tracking';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number (e.g., ORD-2025-000001)';

-- Order items: Individual items in an order
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    attributes JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_item_amounts CHECK (unit_price >= 0 AND subtotal >= 0)
);

COMMENT ON TABLE order_items IS 'Order line items with product snapshots';
COMMENT ON COLUMN order_items.attributes IS 'Snapshot of product/variant attributes at order time';

-- Order status history: Order status change tracking
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status_enum NOT NULL,
    notes TEXT,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_status_history IS 'Audit trail of order status changes';

-- Order tracking: Courier tracking information
CREATE TABLE order_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status tracking_status_enum NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_tracking IS 'Real-time courier location and delivery status tracking';

-- ============================================================================
-- FINANCIAL SYSTEM
-- ============================================================================

-- Wallets: User wallet for GoGoMoney
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

COMMENT ON TABLE wallets IS 'GoGoMoney internal wallet system';

-- Wallet transactions: Wallet transaction history
CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type transaction_type_enum NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_amount_not_zero CHECK (amount != 0)
);

COMMENT ON TABLE wallet_transactions IS 'Complete transaction history with balance snapshots';
COMMENT ON COLUMN wallet_transactions.reference_type IS 'Entity type: order, payout, refund, etc.';

-- Commissions: Platform commission records
CREATE TABLE commissions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    order_amount DECIMAL(12, 2) NOT NULL,
    status commission_status_enum NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

COMMENT ON TABLE commissions IS 'Platform commission tracking per order';

-- Payouts: Seller payout records
CREATE TABLE payouts (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    method payout_method_enum NOT NULL,
    status payout_status_enum NOT NULL DEFAULT 'pending',
    bank_account_id BIGINT,
    transaction_id VARCHAR(255),
    notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payout_amount CHECK (amount > 0)
);

COMMENT ON TABLE payouts IS 'Seller payout requests and processing';

-- Bank accounts: User bank account information
CREATE TABLE bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(200) NOT NULL,
    account_holder_name VARCHAR(200) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    routing_number VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE bank_accounts IS 'User bank accounts for payouts';
COMMENT ON COLUMN bank_accounts.account_number IS 'Should be encrypted at application level';

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

-- Stories: 24-hour stories feature
CREATE TABLE stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type story_type_enum NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 5,
    caption TEXT,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE stories IS '24-hour ephemeral stories (Instagram-style)';
COMMENT ON COLUMN stories.duration IS 'Display duration in seconds';

-- Story views: Story view tracking
CREATE TABLE story_views (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

COMMENT ON TABLE story_views IS 'Track who viewed each story';

-- Reels: TikTok-style short videos
CREATE TABLE reels (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    duration INTEGER NOT NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE reels IS 'Short-form video content (TikTok-style)';

-- Reel likes: Reel like tracking
CREATE TABLE reel_likes (
    id BIGSERIAL PRIMARY KEY,
    reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(reel_id, user_id)
);

COMMENT ON TABLE reel_likes IS 'Track reel likes';

-- Reel comments: Comments on reels
CREATE TABLE reel_comments (
    id BIGSERIAL PRIMARY KEY,
    reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES reel_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE reel_comments IS 'Nested comments on reels';

-- Subscriptions: User subscription relationships
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    subscriber_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_to_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(subscriber_id, subscribed_to_id),
    CONSTRAINT chk_no_self_subscription CHECK (subscriber_id != subscribed_to_id)
);

COMMENT ON TABLE subscriptions IS 'User follow/subscription relationships';

-- ============================================================================
-- COMMUNICATION
-- ============================================================================

-- Chats: Chat conversations
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    type chat_type_enum NOT NULL,
    name VARCHAR(255),
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chats IS 'Chat conversations (direct, group, support)';

-- Chat participants: Chat participants
CREATE TABLE chat_participants (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role chat_role_enum DEFAULT 'member',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);

COMMENT ON TABLE chat_participants IS 'Users participating in chats';

-- Messages: Chat messages
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_to_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    type message_type_enum NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    metadata JSONB,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'Chat messages with support for various media types';

-- Message reads: Message read receipts
CREATE TABLE message_reads (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

COMMENT ON TABLE message_reads IS 'Message read receipts for delivery confirmation';

-- ============================================================================
-- REVIEWS AND RATINGS
-- ============================================================================

-- Reviews: Product and seller reviews
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    pros TEXT,
    cons TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

COMMENT ON TABLE reviews IS 'Product and seller reviews with ratings';

-- Review images: Review image attachments
CREATE TABLE review_images (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE review_images IS 'Customer photos attached to reviews';

-- Review responses: Seller responses to reviews
CREATE TABLE review_responses (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT UNIQUE NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE review_responses IS 'Seller responses to customer reviews';

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notifications: User notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data JSONB,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'User notifications for various events';

-- Notification settings: User notification preferences
CREATE TABLE notification_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    order_updates BOOLEAN DEFAULT TRUE,
    promotions BOOLEAN DEFAULT TRUE,
    messages BOOLEAN DEFAULT TRUE,
    reviews BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_settings IS 'User notification preferences';

-- ============================================================================
-- DELIVERY SYSTEM
-- ============================================================================

-- Delivery zones: Delivery zone definitions
CREATE TABLE delivery_zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    districts JSONB,
    polygon GEOGRAPHY(POLYGON),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE delivery_zones IS 'Geographic delivery zones with polygon boundaries';

-- Delivery tariffs: Delivery pricing
CREATE TABLE delivery_tariffs (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    base_cost DECIMAL(12, 2) NOT NULL,
    cost_per_km DECIMAL(12, 2) DEFAULT 0,
    cost_per_kg DECIMAL(12, 2) DEFAULT 0,
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    free_delivery_threshold DECIMAL(12, 2),
    estimated_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE delivery_tariffs IS 'Delivery pricing structure per zone';

-- ============================================================================
-- DISPUTES AND RETURNS
-- ============================================================================

-- Disputes: Order disputes
CREATE TABLE disputes (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    opened_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type dispute_type_enum NOT NULL,
    reason TEXT NOT NULL,
    status dispute_status_enum NOT NULL DEFAULT 'open',
    resolution TEXT,
    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE disputes IS 'Order dispute management';

-- Dispute messages: Dispute conversation
CREATE TABLE dispute_messages (
    id BIGSERIAL PRIMARY KEY,
    dispute_id BIGINT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dispute_messages IS 'Conversation thread for disputes';

-- Returns: Product return requests
CREATE TABLE returns (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status return_status_enum NOT NULL DEFAULT 'requested',
    refund_amount DECIMAL(12, 2) NOT NULL,
    refund_method refund_method_enum NOT NULL,
    tracking_number VARCHAR(100),
    notes TEXT,
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE returns IS 'Product return and refund requests';

-- Return items: Items in return request
CREATE TABLE return_items (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    reason TEXT,
    condition return_condition_enum NOT NULL,
    images JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_return_quantity CHECK (quantity > 0)
);

COMMENT ON TABLE return_items IS 'Individual items in return request';

-- ============================================================================
-- PROMOTIONS AND DISCOUNTS
-- ============================================================================

-- Promo codes: Promotional discount codes
CREATE TABLE promo_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type promo_type_enum NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    max_discount_amount DECIMAL(12, 2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1,
    applicable_to promo_applicable_enum NOT NULL,
    applicable_ids JSONB,
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promo_codes IS 'Promotional discount codes with usage limits';

-- Promo code usage: Promo code usage tracking
CREATE TABLE promo_code_usage (
    id BIGSERIAL PRIMARY KEY,
    promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promo_code_usage IS 'Track promo code usage per user and order';

-- Flash sales: Time-limited flash sales
CREATE TABLE flash_sales (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_flash_discount CHECK (discount_percentage > 0 AND discount_percentage <= 100)
);

COMMENT ON TABLE flash_sales IS 'Time-limited flash sale events';

-- Flash sale products: Products in flash sales
CREATE TABLE flash_sale_products (
    id BIGSERIAL PRIMARY KEY,
    flash_sale_id BIGINT NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    stock_limit INTEGER,
    sold_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE flash_sale_products IS 'Products participating in flash sales';

-- ============================================================================
-- ANALYTICS AND REPORTS
-- ============================================================================

-- Analytics events: Event tracking for analytics
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    properties JSONB,
    page_url TEXT,
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE analytics_events IS 'User behavior and event tracking';

-- Seller statistics: Aggregated seller statistics
CREATE TABLE seller_statistics (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_products INTEGER DEFAULT 0,
    active_products INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_commission DECIMAL(12, 2) DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    response_rate DECIMAL(5, 2) DEFAULT 0,
    response_time_hours DECIMAL(8, 2) DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE seller_statistics IS 'Aggregated seller performance metrics';

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- Settings: System-wide settings
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type setting_type_enum NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE settings IS 'System configuration and settings';

-- Audit logs: System audit trail
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Complete audit trail of system changes';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Admin roles indexes
CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX idx_admin_roles_type ON admin_roles(role_type);

-- User sessions indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- User addresses indexes
CREATE INDEX idx_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_addresses_is_default ON user_addresses(user_id, is_default);
CREATE INDEX idx_addresses_location ON user_addresses(latitude, longitude);

-- Categories indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_rating ON products(rating_average DESC);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- Product variants indexes
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- Product attributes indexes
CREATE INDEX idx_attributes_product_id ON product_attributes(product_id);

-- Orders indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_courier_id ON orders(courier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Order status history indexes
CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_status_history_created ON order_status_history(created_at DESC);

-- Order tracking indexes
CREATE INDEX idx_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_tracking_courier_id ON order_tracking(courier_id);
CREATE INDEX idx_tracking_created ON order_tracking(created_at DESC);

-- Wallets indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Wallet transactions indexes
CREATE INDEX idx_wallet_txn_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_txn_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_txn_reference ON wallet_transactions(reference_type, reference_id);
CREATE INDEX idx_wallet_txn_created ON wallet_transactions(created_at DESC);

-- Commissions indexes
CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_commissions_seller_id ON commissions(seller_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Payouts indexes
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created ON payouts(created_at DESC);

-- Bank accounts indexes
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_default ON bank_accounts(user_id, is_default);

-- Stories indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_active ON stories(is_active, expires_at);
CREATE INDEX idx_stories_created ON stories(created_at DESC);

-- Story views indexes
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);

-- Reels indexes
CREATE INDEX idx_reels_user_id ON reels(user_id);
CREATE INDEX idx_reels_active ON reels(is_active);
CREATE INDEX idx_reels_created ON reels(created_at DESC);
CREATE INDEX idx_reels_popular ON reels(view_count DESC, like_count DESC);

-- Reel likes indexes
CREATE INDEX idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX idx_reel_likes_user_id ON reel_likes(user_id);

-- Reel comments indexes
CREATE INDEX idx_reel_comments_reel_id ON reel_comments(reel_id);
CREATE INDEX idx_reel_comments_user_id ON reel_comments(user_id);
CREATE INDEX idx_reel_comments_parent_id ON reel_comments(parent_id);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_subscribed_to ON subscriptions(subscribed_to_id);

-- Chats indexes
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);

-- Chat participants indexes
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);

-- Messages indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Message reads indexes
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- Review images indexes
CREATE INDEX idx_review_images_review_id ON review_images(review_id);

-- Review responses indexes
CREATE INDEX idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX idx_review_responses_seller_id ON review_responses(seller_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Notification settings indexes
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Delivery zones indexes
CREATE INDEX idx_delivery_zones_city ON delivery_zones(city);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_delivery_zones_polygon ON delivery_zones USING GIST(polygon);

-- Delivery tariffs indexes
CREATE INDEX idx_delivery_tariffs_zone_id ON delivery_tariffs(zone_id);
CREATE INDEX idx_delivery_tariffs_active ON delivery_tariffs(is_active);

-- Disputes indexes
CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_disputes_opened_by ON disputes(opened_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Dispute messages indexes
CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_created ON dispute_messages(created_at DESC);

-- Returns indexes
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_buyer_id ON returns(buyer_id);
CREATE INDEX idx_returns_status ON returns(status);

-- Return items indexes
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_return_items_order_item_id ON return_items(order_item_id);

-- Promo codes indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, starts_at, expires_at);
CREATE INDEX idx_promo_codes_type ON promo_codes(type);

-- Promo code usage indexes
CREATE INDEX idx_promo_usage_code_id ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_user_id ON promo_code_usage(user_id);
CREATE INDEX idx_promo_usage_order_id ON promo_code_usage(order_id);

-- Flash sales indexes
CREATE INDEX idx_flash_sales_active ON flash_sales(is_active, starts_at, ends_at);

-- Flash sale products indexes
CREATE INDEX idx_flash_sale_products_sale_id ON flash_sale_products(flash_sale_id);
CREATE INDEX idx_flash_sale_products_product_id ON flash_sale_products(product_id);

-- Analytics events indexes
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- Seller statistics indexes
CREATE INDEX idx_seller_stats_seller_id ON seller_statistics(seller_id);
CREATE INDEX idx_seller_stats_revenue ON seller_statistics(total_revenue DESC);
CREATE INDEX idx_seller_stats_rating ON seller_statistics(average_rating DESC);

-- Settings indexes
CREATE INDEX idx_settings_key ON settings(key);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (Adding after promo_codes table exists)
-- ============================================================================

ALTER TABLE orders ADD CONSTRAINT fk_orders_promo_code 
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL;

ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_address 
    FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id) ON DELETE RESTRICT;

ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_zone 
    FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL;

ALTER TABLE payouts ADD CONSTRAINT fk_payouts_bank_account 
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reel_comments_updated_at BEFORE UPDATE ON reel_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON review_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_tariffs_updated_at BEFORE UPDATE ON delivery_tariffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flash_sales_updated_at BEFORE UPDATE ON flash_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Insert default system settings
INSERT INTO settings (key, value, type, description, is_public) VALUES
('platform_name', 'GOGOMARKET', 'string', 'Platform name', true),
('platform_currency', 'UZS', 'string', 'Default platform currency', true),
('commission_rate', '10', 'number', 'Default commission rate percentage', false),
('min_payout_amount', '100000', 'number', 'Minimum payout amount in UZS', false),
('story_duration_hours', '24', 'number', 'Story expiration time in hours', false),
('max_product_images', '10', 'number', 'Maximum product images allowed', true),
('order_auto_complete_days', '7', 'number', 'Days after which order auto-completes', false);

-- ============================================================================
-- COMMENTS ON DATABASE
-- ============================================================================

COMMENT ON DATABASE postgres IS 'GOGOMARKET - Multi-role marketplace platform with social features';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
