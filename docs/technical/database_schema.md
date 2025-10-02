
# GOGOMARKET Database Schema

## Overview

This document describes the complete PostgreSQL database schema for the GOGOMARKET platform. The schema is designed to support a multi-role marketplace with social features, financial transactions, and comprehensive order management.

### Key Features
- Multi-role user system (Admin, Buyer, Seller, Courier)
- Product catalog with multi-level categories and variants
- Order management with status tracking and courier assignment
- Financial system with commissions, payouts, and GoGoMoney wallet
- Social features: stories, reels, subscriptions, likes, comments
- Real-time chat system
- Reviews and ratings
- Notifications
- Analytics and reporting
- Delivery zones and tariffs
- Disputes and returns management
- Promotions and discount system

## Database Design Principles

1. **Normalization**: Schema follows 3NF to minimize redundancy
2. **Soft Deletes**: Critical tables use `deleted_at` for data retention
3. **Audit Trail**: `created_at` and `updated_at` timestamps on all tables
4. **Indexing Strategy**: Indexes on foreign keys, frequently queried fields, and composite keys
5. **UUID Support**: Primary keys use BIGSERIAL for performance, with UUID option for distributed systems
6. **JSONB Usage**: Flexible metadata storage for extensibility
7. **Enum Types**: PostgreSQL ENUMs for status fields to ensure data integrity

## Core Tables

### 1. Users and Authentication

#### users
Primary user table for all platform participants.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique user identifier |
| uuid | UUID | UNIQUE, NOT NULL | Universal unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| phone | VARCHAR(20) | UNIQUE | Phone number with country code |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| avatar_url | TEXT | | Profile picture URL |
| role | user_role_enum | NOT NULL | User role (admin, buyer, seller, courier) |
| status | user_status_enum | NOT NULL, DEFAULT 'active' | Account status |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| phone_verified | BOOLEAN | DEFAULT FALSE | Phone verification status |
| last_login_at | TIMESTAMP | | Last login timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes:**
- `idx_users_email` on (email)
- `idx_users_phone` on (phone)
- `idx_users_uuid` on (uuid)
- `idx_users_role` on (role)
- `idx_users_status` on (status)

#### admin_roles
Granular permissions for admin users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Role identifier |
| user_id | BIGINT | FK users(id), NOT NULL | Reference to user |
| role_type | admin_role_enum | NOT NULL | Admin role type |
| permissions | JSONB | NOT NULL | Detailed permissions object |
| granted_by | BIGINT | FK users(id) | Admin who granted role |
| granted_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Role grant timestamp |
| expires_at | TIMESTAMP | | Optional expiration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_admin_roles_user_id` on (user_id)
- `idx_admin_roles_type` on (role_type)

#### user_sessions
Active user sessions for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Session identifier |
| user_id | BIGINT | FK users(id), NOT NULL | Reference to user |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Session token |
| refresh_token | VARCHAR(255) | UNIQUE | Refresh token |
| ip_address | INET | | Client IP address |
| user_agent | TEXT | | Browser/device info |
| expires_at | TIMESTAMP | NOT NULL | Session expiration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_sessions_user_id` on (user_id)
- `idx_sessions_token` on (token)
- `idx_sessions_expires_at` on (expires_at)

#### user_addresses
Delivery and billing addresses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Address identifier |
| user_id | BIGINT | FK users(id), NOT NULL | Reference to user |
| type | address_type_enum | NOT NULL | Address type (delivery, billing) |
| is_default | BOOLEAN | DEFAULT FALSE | Default address flag |
| label | VARCHAR(50) | | Address label (home, work, etc.) |
| full_name | VARCHAR(200) | NOT NULL | Recipient name |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| country | VARCHAR(100) | NOT NULL | Country |
| city | VARCHAR(100) | NOT NULL | City |
| district | VARCHAR(100) | | District/region |
| street | VARCHAR(255) | NOT NULL | Street address |
| building | VARCHAR(50) | | Building number |
| apartment | VARCHAR(50) | | Apartment/unit |
| postal_code | VARCHAR(20) | | Postal code |
| latitude | DECIMAL(10, 8) | | GPS latitude |
| longitude | DECIMAL(11, 8) | | GPS longitude |
| delivery_instructions | TEXT | | Special instructions |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_addresses_user_id` on (user_id)
- `idx_addresses_is_default` on (user_id, is_default)
- `idx_addresses_location` on (latitude, longitude)

### 2. Product Catalog

#### categories
Multi-level product categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Category identifier |
| parent_id | BIGINT | FK categories(id) | Parent category |
| name | VARCHAR(200) | NOT NULL | Category name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | | Category description |
| icon_url | TEXT | | Category icon |
| image_url | TEXT | | Category image |
| level | INTEGER | NOT NULL, DEFAULT 0 | Hierarchy level |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| meta_title | VARCHAR(255) | | SEO meta title |
| meta_description | TEXT | | SEO meta description |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_categories_parent_id` on (parent_id)
- `idx_categories_slug` on (slug)
- `idx_categories_level` on (level)
- `idx_categories_active` on (is_active)

#### products
Main product table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Product identifier |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| category_id | BIGINT | FK categories(id), NOT NULL | Category reference |
| name | VARCHAR(255) | NOT NULL | Product name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | NOT NULL | Product description |
| short_description | VARCHAR(500) | | Brief description |
| sku | VARCHAR(100) | UNIQUE | Stock keeping unit |
| barcode | VARCHAR(100) | | Product barcode |
| brand | VARCHAR(100) | | Brand name |
| base_price | DECIMAL(12, 2) | NOT NULL | Base price |
| sale_price | DECIMAL(12, 2) | | Sale price |
| cost_price | DECIMAL(12, 2) | | Cost price (for margin calc) |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'UZS' | Currency code |
| tax_rate | DECIMAL(5, 2) | DEFAULT 0 | Tax percentage |
| weight | DECIMAL(10, 3) | | Weight in kg |
| length | DECIMAL(10, 2) | | Length in cm |
| width | DECIMAL(10, 2) | | Width in cm |
| height | DECIMAL(10, 2) | | Height in cm |
| status | product_status_enum | NOT NULL, DEFAULT 'draft' | Product status |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured product flag |
| is_digital | BOOLEAN | DEFAULT FALSE | Digital product flag |
| requires_shipping | BOOLEAN | DEFAULT TRUE | Shipping required flag |
| stock_quantity | INTEGER | DEFAULT 0 | Total stock quantity |
| low_stock_threshold | INTEGER | DEFAULT 10 | Low stock alert threshold |
| allow_backorder | BOOLEAN | DEFAULT FALSE | Allow backorder flag |
| min_order_quantity | INTEGER | DEFAULT 1 | Minimum order quantity |
| max_order_quantity | INTEGER | | Maximum order quantity |
| view_count | INTEGER | DEFAULT 0 | Product view counter |
| rating_average | DECIMAL(3, 2) | DEFAULT 0 | Average rating |
| rating_count | INTEGER | DEFAULT 0 | Number of ratings |
| meta_title | VARCHAR(255) | | SEO meta title |
| meta_description | TEXT | | SEO meta description |
| meta_keywords | TEXT | | SEO keywords |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| published_at | TIMESTAMP | | Publication timestamp |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_products_seller_id` on (seller_id)
- `idx_products_category_id` on (category_id)
- `idx_products_slug` on (slug)
- `idx_products_sku` on (sku)
- `idx_products_status` on (status)
- `idx_products_featured` on (is_featured)
- `idx_products_rating` on (rating_average DESC)
- `idx_products_created` on (created_at DESC)

#### product_images
Product image gallery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Image identifier |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| url | TEXT | NOT NULL | Image URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| alt_text | VARCHAR(255) | | Alt text for SEO |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary image flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_product_images_product_id` on (product_id)
- `idx_product_images_primary` on (product_id, is_primary)

#### product_variants
Product variations (size, color, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Variant identifier |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| sku | VARCHAR(100) | UNIQUE | Variant SKU |
| name | VARCHAR(255) | NOT NULL | Variant name |
| attributes | JSONB | NOT NULL | Variant attributes (color, size, etc.) |
| price_adjustment | DECIMAL(12, 2) | DEFAULT 0 | Price difference from base |
| stock_quantity | INTEGER | DEFAULT 0 | Variant stock |
| image_url | TEXT | | Variant-specific image |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_variants_product_id` on (product_id)
- `idx_variants_sku` on (sku)
- `idx_variants_active` on (is_active)

#### product_attributes
Product attribute definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Attribute identifier |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| name | VARCHAR(100) | NOT NULL | Attribute name |
| value | TEXT | NOT NULL | Attribute value |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_attributes_product_id` on (product_id)

### 3. Orders and Transactions

#### orders
Main order table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Order identifier |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable order number |
| buyer_id | BIGINT | FK users(id), NOT NULL | Buyer reference |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| courier_id | BIGINT | FK users(id) | Assigned courier |
| status | order_status_enum | NOT NULL, DEFAULT 'pending' | Order status |
| payment_status | payment_status_enum | NOT NULL, DEFAULT 'pending' | Payment status |
| payment_method | payment_method_enum | NOT NULL | Payment method |
| subtotal | DECIMAL(12, 2) | NOT NULL | Items subtotal |
| discount_amount | DECIMAL(12, 2) | DEFAULT 0 | Discount amount |
| tax_amount | DECIMAL(12, 2) | DEFAULT 0 | Tax amount |
| shipping_cost | DECIMAL(12, 2) | DEFAULT 0 | Shipping cost |
| commission_amount | DECIMAL(12, 2) | DEFAULT 0 | Platform commission |
| total_amount | DECIMAL(12, 2) | NOT NULL | Total order amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'UZS' | Currency code |
| promo_code_id | BIGINT | FK promo_codes(id) | Applied promo code |
| delivery_address_id | BIGINT | FK user_addresses(id), NOT NULL | Delivery address |
| delivery_zone_id | BIGINT | FK delivery_zones(id) | Delivery zone |
| estimated_delivery_date | DATE | | Estimated delivery |
| actual_delivery_date | TIMESTAMP | | Actual delivery time |
| notes | TEXT | | Order notes |
| cancellation_reason | TEXT | | Cancellation reason |
| cancelled_by | BIGINT | FK users(id) | User who cancelled |
| cancelled_at | TIMESTAMP | | Cancellation timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_orders_number` on (order_number)
- `idx_orders_buyer_id` on (buyer_id)
- `idx_orders_seller_id` on (seller_id)
- `idx_orders_courier_id` on (courier_id)
- `idx_orders_status` on (status)
- `idx_orders_payment_status` on (payment_status)
- `idx_orders_created` on (created_at DESC)

#### order_items
Individual items in an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Item identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| variant_id | BIGINT | FK product_variants(id) | Variant reference |
| product_name | VARCHAR(255) | NOT NULL | Product name snapshot |
| variant_name | VARCHAR(255) | | Variant name snapshot |
| sku | VARCHAR(100) | | SKU snapshot |
| quantity | INTEGER | NOT NULL | Quantity ordered |
| unit_price | DECIMAL(12, 2) | NOT NULL | Price per unit |
| discount_amount | DECIMAL(12, 2) | DEFAULT 0 | Item discount |
| tax_amount | DECIMAL(12, 2) | DEFAULT 0 | Item tax |
| subtotal | DECIMAL(12, 2) | NOT NULL | Item subtotal |
| attributes | JSONB | | Item attributes snapshot |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_order_items_order_id` on (order_id)
- `idx_order_items_product_id` on (product_id)

#### order_status_history
Order status change tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | History identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| status | order_status_enum | NOT NULL | New status |
| notes | TEXT | | Status change notes |
| changed_by | BIGINT | FK users(id) | User who changed status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_status_history_order_id` on (order_id)
- `idx_status_history_created` on (created_at DESC)

#### order_tracking
Courier tracking information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Tracking identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| courier_id | BIGINT | FK users(id), NOT NULL | Courier reference |
| status | tracking_status_enum | NOT NULL | Tracking status |
| latitude | DECIMAL(10, 8) | | Current latitude |
| longitude | DECIMAL(11, 8) | | Current longitude |
| notes | TEXT | | Tracking notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_tracking_order_id` on (order_id)
- `idx_tracking_courier_id` on (courier_id)
- `idx_tracking_created` on (created_at DESC)

### 4. Financial System

#### wallets
User wallet for GoGoMoney.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Wallet identifier |
| user_id | BIGINT | FK users(id), UNIQUE, NOT NULL | User reference |
| balance | DECIMAL(12, 2) | NOT NULL, DEFAULT 0 | Current balance |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'UZS' | Currency code |
| is_active | BOOLEAN | DEFAULT TRUE | Wallet status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_wallets_user_id` on (user_id)

#### wallet_transactions
Wallet transaction history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Transaction identifier |
| wallet_id | BIGINT | FK wallets(id), NOT NULL | Wallet reference |
| type | transaction_type_enum | NOT NULL | Transaction type |
| amount | DECIMAL(12, 2) | NOT NULL | Transaction amount |
| balance_before | DECIMAL(12, 2) | NOT NULL | Balance before transaction |
| balance_after | DECIMAL(12, 2) | NOT NULL | Balance after transaction |
| reference_type | VARCHAR(50) | | Reference entity type |
| reference_id | BIGINT | | Reference entity ID |
| description | TEXT | | Transaction description |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_wallet_txn_wallet_id` on (wallet_id)
- `idx_wallet_txn_type` on (type)
- `idx_wallet_txn_reference` on (reference_type, reference_id)
- `idx_wallet_txn_created` on (created_at DESC)

#### commissions
Platform commission records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Commission identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| commission_rate | DECIMAL(5, 2) | NOT NULL | Commission percentage |
| commission_amount | DECIMAL(12, 2) | NOT NULL | Commission amount |
| order_amount | DECIMAL(12, 2) | NOT NULL | Order amount |
| status | commission_status_enum | NOT NULL, DEFAULT 'pending' | Commission status |
| paid_at | TIMESTAMP | | Payment timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_commissions_order_id` on (order_id)
- `idx_commissions_seller_id` on (seller_id)
- `idx_commissions_status` on (status)

#### payouts
Seller payout records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Payout identifier |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| amount | DECIMAL(12, 2) | NOT NULL | Payout amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'UZS' | Currency code |
| method | payout_method_enum | NOT NULL | Payout method |
| status | payout_status_enum | NOT NULL, DEFAULT 'pending' | Payout status |
| bank_account_id | BIGINT | FK bank_accounts(id) | Bank account reference |
| transaction_id | VARCHAR(255) | | External transaction ID |
| notes | TEXT | | Payout notes |
| processed_at | TIMESTAMP | | Processing timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_payouts_seller_id` on (seller_id)
- `idx_payouts_status` on (status)
- `idx_payouts_created` on (created_at DESC)

#### bank_accounts
User bank account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Account identifier |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| bank_name | VARCHAR(200) | NOT NULL | Bank name |
| account_holder_name | VARCHAR(200) | NOT NULL | Account holder name |
| account_number | VARCHAR(100) | NOT NULL | Account number |
| routing_number | VARCHAR(50) | | Routing/SWIFT code |
| is_default | BOOLEAN | DEFAULT FALSE | Default account flag |
| is_verified | BOOLEAN | DEFAULT FALSE | Verification status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_bank_accounts_user_id` on (user_id)
- `idx_bank_accounts_default` on (user_id, is_default)

### 5. Social Features

#### stories
24-hour stories feature.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Story identifier |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| type | story_type_enum | NOT NULL | Story type (image, video) |
| media_url | TEXT | NOT NULL | Media URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| duration | INTEGER | DEFAULT 5 | Display duration (seconds) |
| caption | TEXT | | Story caption |
| view_count | INTEGER | DEFAULT 0 | View counter |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| expires_at | TIMESTAMP | NOT NULL | Expiration time (24h) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_stories_user_id` on (user_id)
- `idx_stories_active` on (is_active, expires_at)
- `idx_stories_created` on (created_at DESC)

#### story_views
Story view tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | View identifier |
| story_id | BIGINT | FK stories(id), NOT NULL | Story reference |
| viewer_id | BIGINT | FK users(id), NOT NULL | Viewer reference |
| viewed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | View timestamp |

**Indexes:**
- `idx_story_views_story_id` on (story_id)
- `idx_story_views_viewer_id` on (viewer_id)
- `idx_story_views_unique` UNIQUE on (story_id, viewer_id)

#### reels
TikTok-style short videos.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Reel identifier |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| video_url | TEXT | NOT NULL | Video URL |
| thumbnail_url | TEXT | NOT NULL | Thumbnail URL |
| title | VARCHAR(255) | | Reel title |
| description | TEXT | | Reel description |
| duration | INTEGER | NOT NULL | Video duration (seconds) |
| view_count | INTEGER | DEFAULT 0 | View counter |
| like_count | INTEGER | DEFAULT 0 | Like counter |
| comment_count | INTEGER | DEFAULT 0 | Comment counter |
| share_count | INTEGER | DEFAULT 0 | Share counter |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_reels_user_id` on (user_id)
- `idx_reels_active` on (is_active)
- `idx_reels_created` on (created_at DESC)
- `idx_reels_popular` on (view_count DESC, like_count DESC)

#### reel_likes
Reel like tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Like identifier |
| reel_id | BIGINT | FK reels(id), NOT NULL | Reel reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_reel_likes_reel_id` on (reel_id)
- `idx_reel_likes_user_id` on (user_id)
- `idx_reel_likes_unique` UNIQUE on (reel_id, user_id)

#### reel_comments
Comments on reels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Comment identifier |
| reel_id | BIGINT | FK reels(id), NOT NULL | Reel reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| parent_id | BIGINT | FK reel_comments(id) | Parent comment (for replies) |
| content | TEXT | NOT NULL | Comment content |
| like_count | INTEGER | DEFAULT 0 | Like counter |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_reel_comments_reel_id` on (reel_id)
- `idx_reel_comments_user_id` on (user_id)
- `idx_reel_comments_parent_id` on (parent_id)

#### subscriptions
User subscription relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Subscription identifier |
| subscriber_id | BIGINT | FK users(id), NOT NULL | Subscriber reference |
| subscribed_to_id | BIGINT | FK users(id), NOT NULL | Subscribed user reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_subscriptions_subscriber` on (subscriber_id)
- `idx_subscriptions_subscribed_to` on (subscribed_to_id)
- `idx_subscriptions_unique` UNIQUE on (subscriber_id, subscribed_to_id)

### 6. Communication

#### chats
Chat conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Chat identifier |
| type | chat_type_enum | NOT NULL | Chat type (direct, group, support) |
| name | VARCHAR(255) | | Chat name (for groups) |
| created_by | BIGINT | FK users(id), NOT NULL | Creator reference |
| last_message_at | TIMESTAMP | | Last message timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_chats_type` on (type)
- `idx_chats_last_message` on (last_message_at DESC)

#### chat_participants
Chat participants.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Participant identifier |
| chat_id | BIGINT | FK chats(id), NOT NULL | Chat reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| role | chat_role_enum | DEFAULT 'member' | Participant role |
| joined_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Join timestamp |
| last_read_at | TIMESTAMP | | Last read timestamp |
| is_muted | BOOLEAN | DEFAULT FALSE | Mute status |

**Indexes:**
- `idx_chat_participants_chat_id` on (chat_id)
- `idx_chat_participants_user_id` on (user_id)
- `idx_chat_participants_unique` UNIQUE on (chat_id, user_id)

#### messages
Chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Message identifier |
| chat_id | BIGINT | FK chats(id), NOT NULL | Chat reference |
| sender_id | BIGINT | FK users(id), NOT NULL | Sender reference |
| reply_to_id | BIGINT | FK messages(id) | Reply to message |
| type | message_type_enum | NOT NULL, DEFAULT 'text' | Message type |
| content | TEXT | | Message content |
| media_url | TEXT | | Media URL |
| metadata | JSONB | | Additional metadata |
| is_edited | BOOLEAN | DEFAULT FALSE | Edit flag |
| is_deleted | BOOLEAN | DEFAULT FALSE | Delete flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_messages_chat_id` on (chat_id)
- `idx_messages_sender_id` on (sender_id)
- `idx_messages_created` on (created_at DESC)

#### message_reads
Message read receipts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Read identifier |
| message_id | BIGINT | FK messages(id), NOT NULL | Message reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| read_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Read timestamp |

**Indexes:**
- `idx_message_reads_message_id` on (message_id)
- `idx_message_reads_user_id` on (user_id)
- `idx_message_reads_unique` UNIQUE on (message_id, user_id)

### 7. Reviews and Ratings

#### reviews
Product and seller reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Review identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| buyer_id | BIGINT | FK users(id), NOT NULL | Buyer reference |
| rating | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating (1-5) |
| title | VARCHAR(255) | | Review title |
| content | TEXT | | Review content |
| pros | TEXT | | Positive aspects |
| cons | TEXT | | Negative aspects |
| is_verified_purchase | BOOLEAN | DEFAULT TRUE | Verified purchase flag |
| is_approved | BOOLEAN | DEFAULT FALSE | Approval status |
| helpful_count | INTEGER | DEFAULT 0 | Helpful vote count |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | Soft delete |

**Indexes:**
- `idx_reviews_product_id` on (product_id)
- `idx_reviews_seller_id` on (seller_id)
- `idx_reviews_buyer_id` on (buyer_id)
- `idx_reviews_order_id` on (order_id)
- `idx_reviews_rating` on (rating)
- `idx_reviews_approved` on (is_approved)

#### review_images
Review image attachments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Image identifier |
| review_id | BIGINT | FK reviews(id), NOT NULL | Review reference |
| url | TEXT | NOT NULL | Image URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_review_images_review_id` on (review_id)

#### review_responses
Seller responses to reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Response identifier |
| review_id | BIGINT | FK reviews(id), UNIQUE, NOT NULL | Review reference |
| seller_id | BIGINT | FK users(id), NOT NULL | Seller reference |
| content | TEXT | NOT NULL | Response content |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_review_responses_review_id` on (review_id)
- `idx_review_responses_seller_id` on (seller_id)

### 8. Notifications

#### notifications
User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Notification identifier |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| type | notification_type_enum | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| content | TEXT | NOT NULL | Notification content |
| data | JSONB | | Additional data |
| reference_type | VARCHAR(50) | | Reference entity type |
| reference_id | BIGINT | | Reference entity ID |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| read_at | TIMESTAMP | | Read timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_notifications_user_id` on (user_id)
- `idx_notifications_type` on (type)
- `idx_notifications_read` on (user_id, is_read)
- `idx_notifications_created` on (created_at DESC)

#### notification_settings
User notification preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Setting identifier |
| user_id | BIGINT | FK users(id), UNIQUE, NOT NULL | User reference |
| email_enabled | BOOLEAN | DEFAULT TRUE | Email notifications |
| push_enabled | BOOLEAN | DEFAULT TRUE | Push notifications |
| sms_enabled | BOOLEAN | DEFAULT FALSE | SMS notifications |
| order_updates | BOOLEAN | DEFAULT TRUE | Order update notifications |
| promotions | BOOLEAN | DEFAULT TRUE | Promotional notifications |
| messages | BOOLEAN | DEFAULT TRUE | Message notifications |
| reviews | BOOLEAN | DEFAULT TRUE | Review notifications |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_notification_settings_user_id` on (user_id)

### 9. Delivery System

#### delivery_zones
Delivery zone definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Zone identifier |
| name | VARCHAR(200) | NOT NULL | Zone name |
| description | TEXT | | Zone description |
| city | VARCHAR(100) | NOT NULL | City |
| districts | JSONB | | District list |
| polygon | GEOGRAPHY(POLYGON) | | Geographic boundary |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_delivery_zones_city` on (city)
- `idx_delivery_zones_active` on (is_active)
- `idx_delivery_zones_polygon` GIST on (polygon)

#### delivery_tariffs
Delivery pricing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Tariff identifier |
| zone_id | BIGINT | FK delivery_zones(id), NOT NULL | Zone reference |
| name | VARCHAR(200) | NOT NULL | Tariff name |
| base_cost | DECIMAL(12, 2) | NOT NULL | Base delivery cost |
| cost_per_km | DECIMAL(12, 2) | DEFAULT 0 | Cost per kilometer |
| cost_per_kg | DECIMAL(12, 2) | DEFAULT 0 | Cost per kilogram |
| min_order_amount | DECIMAL(12, 2) | DEFAULT 0 | Minimum order for free delivery |
| free_delivery_threshold | DECIMAL(12, 2) | | Free delivery threshold |
| estimated_hours | INTEGER | | Estimated delivery hours |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_delivery_tariffs_zone_id` on (zone_id)
- `idx_delivery_tariffs_active` on (is_active)

### 10. Disputes and Returns

#### disputes
Order disputes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Dispute identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| opened_by | BIGINT | FK users(id), NOT NULL | User who opened dispute |
| type | dispute_type_enum | NOT NULL | Dispute type |
| reason | TEXT | NOT NULL | Dispute reason |
| status | dispute_status_enum | NOT NULL, DEFAULT 'open' | Dispute status |
| resolution | TEXT | | Resolution details |
| resolved_by | BIGINT | FK users(id) | Admin who resolved |
| resolved_at | TIMESTAMP | | Resolution timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_disputes_order_id` on (order_id)
- `idx_disputes_opened_by` on (opened_by)
- `idx_disputes_status` on (status)

#### dispute_messages
Dispute conversation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Message identifier |
| dispute_id | BIGINT | FK disputes(id), NOT NULL | Dispute reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| content | TEXT | NOT NULL | Message content |
| attachments | JSONB | | Attachment URLs |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_dispute_messages_dispute_id` on (dispute_id)
- `idx_dispute_messages_created` on (created_at DESC)

#### returns
Product return requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Return identifier |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| buyer_id | BIGINT | FK users(id), NOT NULL | Buyer reference |
| reason | TEXT | NOT NULL | Return reason |
| status | return_status_enum | NOT NULL, DEFAULT 'requested' | Return status |
| refund_amount | DECIMAL(12, 2) | NOT NULL | Refund amount |
| refund_method | refund_method_enum | NOT NULL | Refund method |
| tracking_number | VARCHAR(100) | | Return tracking number |
| notes | TEXT | | Additional notes |
| approved_by | BIGINT | FK users(id) | Admin who approved |
| approved_at | TIMESTAMP | | Approval timestamp |
| completed_at | TIMESTAMP | | Completion timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_returns_order_id` on (order_id)
- `idx_returns_buyer_id` on (buyer_id)
- `idx_returns_status` on (status)

#### return_items
Items in return request.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Item identifier |
| return_id | BIGINT | FK returns(id), NOT NULL | Return reference |
| order_item_id | BIGINT | FK order_items(id), NOT NULL | Order item reference |
| quantity | INTEGER | NOT NULL | Quantity to return |
| reason | TEXT | | Item-specific reason |
| condition | return_condition_enum | NOT NULL | Item condition |
| images | JSONB | | Condition images |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_return_items_return_id` on (return_id)
- `idx_return_items_order_item_id` on (order_item_id)

### 11. Promotions and Discounts

#### promo_codes
Promotional discount codes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Promo code identifier |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Promo code |
| name | VARCHAR(200) | NOT NULL | Promo name |
| description | TEXT | | Promo description |
| type | promo_type_enum | NOT NULL | Discount type |
| value | DECIMAL(12, 2) | NOT NULL | Discount value |
| min_order_amount | DECIMAL(12, 2) | DEFAULT 0 | Minimum order amount |
| max_discount_amount | DECIMAL(12, 2) | | Maximum discount cap |
| usage_limit | INTEGER | | Total usage limit |
| usage_count | INTEGER | DEFAULT 0 | Current usage count |
| usage_limit_per_user | INTEGER | DEFAULT 1 | Per-user usage limit |
| applicable_to | promo_applicable_enum | NOT NULL | Applicable to (all, category, product) |
| applicable_ids | JSONB | | Applicable entity IDs |
| starts_at | TIMESTAMP | NOT NULL | Start date |
| expires_at | TIMESTAMP | NOT NULL | Expiration date |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_by | BIGINT | FK users(id), NOT NULL | Creator reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_promo_codes_code` on (code)
- `idx_promo_codes_active` on (is_active, starts_at, expires_at)
- `idx_promo_codes_type` on (type)

#### promo_code_usage
Promo code usage tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Usage identifier |
| promo_code_id | BIGINT | FK promo_codes(id), NOT NULL | Promo code reference |
| user_id | BIGINT | FK users(id), NOT NULL | User reference |
| order_id | BIGINT | FK orders(id), NOT NULL | Order reference |
| discount_amount | DECIMAL(12, 2) | NOT NULL | Applied discount |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_promo_usage_code_id` on (promo_code_id)
- `idx_promo_usage_user_id` on (user_id)
- `idx_promo_usage_order_id` on (order_id)

#### flash_sales
Time-limited flash sales.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Flash sale identifier |
| name | VARCHAR(200) | NOT NULL | Sale name |
| description | TEXT | | Sale description |
| discount_percentage | DECIMAL(5, 2) | NOT NULL | Discount percentage |
| starts_at | TIMESTAMP | NOT NULL | Start time |
| ends_at | TIMESTAMP | NOT NULL | End time |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_flash_sales_active` on (is_active, starts_at, ends_at)

#### flash_sale_products
Products in flash sales.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Entry identifier |
| flash_sale_id | BIGINT | FK flash_sales(id), NOT NULL | Flash sale reference |
| product_id | BIGINT | FK products(id), NOT NULL | Product reference |
| original_price | DECIMAL(12, 2) | NOT NULL | Original price |
| sale_price | DECIMAL(12, 2) | NOT NULL | Sale price |
| stock_limit | INTEGER | | Limited stock quantity |
| sold_count | INTEGER | DEFAULT 0 | Sold quantity |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_flash_sale_products_sale_id` on (flash_sale_id)
- `idx_flash_sale_products_product_id` on (product_id)

### 12. Analytics and Reports

#### analytics_events
Event tracking for analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Event identifier |
| user_id | BIGINT | FK users(id) | User reference |
| session_id | VARCHAR(255) | | Session identifier |
| event_type | VARCHAR(100) | NOT NULL | Event type |
| event_name | VARCHAR(200) | NOT NULL | Event name |
| properties | JSONB | | Event properties |
| page_url | TEXT | | Page URL |
| referrer_url | TEXT | | Referrer URL |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Browser/device info |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_analytics_user_id` on (user_id)
- `idx_analytics_session_id` on (session_id)
- `idx_analytics_event_type` on (event_type)
- `idx_analytics_created` on (created_at DESC)

#### seller_statistics
Aggregated seller statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Statistics identifier |
| seller_id | BIGINT | FK users(id), UNIQUE, NOT NULL | Seller reference |
| total_products | INTEGER | DEFAULT 0 | Total products |
| active_products | INTEGER | DEFAULT 0 | Active products |
| total_orders | INTEGER | DEFAULT 0 | Total orders |
| completed_orders | INTEGER | DEFAULT 0 | Completed orders |
| cancelled_orders | INTEGER | DEFAULT 0 | Cancelled orders |
| total_revenue | DECIMAL(12, 2) | DEFAULT 0 | Total revenue |
| total_commission | DECIMAL(12, 2) | DEFAULT 0 | Total commission paid |
| average_rating | DECIMAL(3, 2) | DEFAULT 0 | Average rating |
| total_reviews | INTEGER | DEFAULT 0 | Total reviews |
| response_rate | DECIMAL(5, 2) | DEFAULT 0 | Message response rate |
| response_time_hours | DECIMAL(8, 2) | DEFAULT 0 | Average response time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_seller_stats_seller_id` on (seller_id)
- `idx_seller_stats_revenue` on (total_revenue DESC)
- `idx_seller_stats_rating` on (average_rating DESC)

### 13. System Configuration

#### settings
System-wide settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Setting identifier |
| key | VARCHAR(100) | UNIQUE, NOT NULL | Setting key |
| value | TEXT | NOT NULL | Setting value |
| type | setting_type_enum | NOT NULL | Value type |
| description | TEXT | | Setting description |
| is_public | BOOLEAN | DEFAULT FALSE | Public visibility |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_settings_key` on (key)

#### audit_logs
System audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Log identifier |
| user_id | BIGINT | FK users(id) | User reference |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(100) | NOT NULL | Entity type |
| entity_id | BIGINT | | Entity ID |
| old_values | JSONB | | Previous values |
| new_values | JSONB | | New values |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Browser/device info |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Indexes:**
- `idx_audit_logs_user_id` on (user_id)
- `idx_audit_logs_entity` on (entity_type, entity_id)
- `idx_audit_logs_action` on (action)
- `idx_audit_logs_created` on (created_at DESC)

## PostgreSQL ENUM Types

The schema uses the following ENUM types for data integrity:

```sql
-- User related
CREATE TYPE user_role_enum AS ENUM ('admin', 'buyer', 'seller', 'courier');
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'role_manager', 'accounting', 'technical_access');
CREATE TYPE address_type_enum AS ENUM ('delivery', 'billing');

-- Product related
CREATE TYPE product_status_enum AS ENUM ('draft', 'active', 'inactive', 'out_of_stock', 'discontinued');

-- Order related
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'gogomoney', 'bank_transfer');
CREATE TYPE tracking_status_enum AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');

-- Financial related
CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'withdrawal', 'purchase', 'refund', 'commission', 'payout', 'bonus');
CREATE TYPE commission_status_enum AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE payout_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE payout_method_enum AS ENUM ('bank_transfer', 'gogomoney', 'cash');

-- Social related
CREATE TYPE story_type_enum AS ENUM ('image', 'video');
CREATE TYPE chat_type_enum AS ENUM ('direct', 'group', 'support');
CREATE TYPE chat_role_enum AS ENUM ('admin', 'member');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'video', 'audio', 'file', 'location', 'product');

-- Review related
CREATE TYPE notification_type_enum AS ENUM ('order', 'message', 'review', 'promotion', 'system', 'payment');

-- Dispute related
CREATE TYPE dispute_type_enum AS ENUM ('product_issue', 'delivery_issue', 'payment_issue', 'other');
CREATE TYPE dispute_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE return_status_enum AS ENUM ('requested', 'approved', 'rejected', 'in_transit', 'received', 'refunded');
CREATE TYPE return_condition_enum AS ENUM ('unopened', 'opened', 'used', 'damaged');
CREATE TYPE refund_method_enum AS ENUM ('original_payment', 'gogomoney', 'bank_transfer');

-- Promotion related
CREATE TYPE promo_type_enum AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE promo_applicable_enum AS ENUM ('all', 'category', 'product', 'seller');

-- System related
CREATE TYPE setting_type_enum AS ENUM ('string', 'number', 'boolean', 'json');
```

## Relationships

### Key Foreign Key Relationships

1. **Users → Orders**: One-to-many (buyer, seller, courier)
2. **Users → Products**: One-to-many (seller)
3. **Users → Wallets**: One-to-one
4. **Products → Categories**: Many-to-one
5. **Products → Product Variants**: One-to-many
6. **Orders → Order Items**: One-to-many
7. **Orders → Order Status History**: One-to-many
8. **Orders → Reviews**: One-to-many
9. **Users → Stories/Reels**: One-to-many
10. **Users → Subscriptions**: Many-to-many (self-referential)
11. **Chats → Messages**: One-to-many
12. **Chats → Chat Participants**: One-to-many
13. **Orders → Disputes**: One-to-many
14. **Orders → Returns**: One-to-many

## Indexing Strategy

### Primary Indexes
- All primary keys have automatic indexes
- Foreign keys have explicit indexes for join performance

### Composite Indexes
- User email and phone for authentication
- Product status and category for filtering
- Order status and dates for dashboard queries
- Chat participants for message retrieval

### Full-Text Search Indexes
Consider adding GIN indexes for full-text search:
```sql
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_categories_search ON categories USING GIN(to_tsvector('english', name || ' ' || description));
```

### Geographic Indexes
For delivery zones:
```sql
CREATE INDEX idx_delivery_zones_polygon ON delivery_zones USING GIST(polygon);
```

## Performance Considerations

1. **Partitioning**: Consider partitioning large tables by date:
   - `analytics_events` by created_at (monthly)
   - `audit_logs` by created_at (monthly)
   - `messages` by created_at (quarterly)

2. **Materialized Views**: For analytics:
   - Daily sales summary
   - Product popularity rankings
   - Seller performance metrics

3. **Caching Strategy**:
   - Cache frequently accessed product data
   - Cache user session data in Redis
   - Cache category tree structure

4. **Query Optimization**:
   - Use EXPLAIN ANALYZE for slow queries
   - Monitor index usage with pg_stat_user_indexes
   - Regular VACUUM and ANALYZE operations

## Data Retention Policies

1. **Soft Deletes**: Most tables use `deleted_at` for recovery
2. **Hard Deletes**: After 90 days for:
   - Expired stories (24 hours + 90 days)
   - Old analytics events (1 year)
   - Audit logs (2 years)

3. **Archival**: Move to cold storage:
   - Completed orders older than 2 years
   - Inactive user data after 3 years

## Security Considerations

1. **Sensitive Data**:
   - Password hashes use bcrypt
   - Bank account numbers should be encrypted at application level
   - PII data should be encrypted at rest

2. **Row-Level Security**:
   - Implement RLS policies for multi-tenant data isolation
   - Restrict admin access based on roles

3. **Audit Trail**:
   - All critical operations logged in audit_logs
   - Track all financial transactions

## Migration Strategy

1. **Initial Setup**: Run schema.sql to create all tables
2. **Seed Data**: Insert default categories, settings, delivery zones
3. **Indexes**: Create indexes after initial data load for better performance
4. **Constraints**: Add foreign key constraints last to avoid circular dependencies

## Backup and Recovery

1. **Daily Backups**: Full database backup
2. **Point-in-Time Recovery**: Enable WAL archiving
3. **Replication**: Set up streaming replication for high availability
4. **Testing**: Regular backup restoration tests

---

*Last Updated: October 2, 2025*
*Schema Version: 1.0.0*
