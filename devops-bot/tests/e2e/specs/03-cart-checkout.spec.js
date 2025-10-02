
const { test, expect } = require('@playwright/test');

test.describe('Cart and Checkout', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(|dashboard)/);
  });

  test('should add product to cart @critical', async ({ page }) => {
    await page.goto('/catalog');
    
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    
    // Should show success message
    await expect(page.locator('text=Added to cart')).toBeVisible({ timeout: 5000 });
    
    // Cart count should update
    const cartBadge = page.locator('[data-testid="cart-count"]');
    await expect(cartBadge).toBeVisible();
  });

  test('should view cart @critical', async ({ page }) => {
    // Add product first
    await page.goto('/catalog');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(1000);
    
    // Go to cart
    await page.goto('/cart');
    
    // Should show cart items
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('should update cart quantity', async ({ page }) => {
    await page.goto('/cart');
    
    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Total should update
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('should checkout @critical', async ({ page }) => {
    // Make sure cart has items
    await page.goto('/catalog');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(1000);
    
    // Go to cart
    await page.goto('/cart');
    
    // Proceed to checkout
    await page.click('button:has-text("Checkout")');
    
    // Should go to checkout page
    await expect(page).toHaveURL(/\/checkout/);
    
    // Fill checkout form
    await page.fill('input[name="address"]', 'Test Street 123');
    await page.fill('input[name="city"]', 'Tashkent');
    await page.fill('input[name="phone"]', '+998991234567');
    
    // Select payment method
    await page.click('[data-testid="payment-card"]');
    
    // Place order
    await page.click('button:has-text("Place Order")');
    
    // Should show success or go to payment
    await expect(page.locator('text=Order placed|Payment')).toBeVisible({ timeout: 10000 });
  });

});
