
const { test, expect } = require('@playwright/test');

test.describe('Seller Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as seller
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', process.env.TEST_SELLER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(|dashboard)/);
  });

  test('should access seller dashboard', async ({ page }) => {
    await page.goto('/seller/dashboard');
    
    // Should show seller dashboard
    await expect(page.locator('text=Sales')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
  });

  test('should add new product', async ({ page }) => {
    await page.goto('/seller/products/new');
    
    // Fill product form
    await page.fill('input[name="title"]', `Test Product ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Test product description');
    await page.fill('input[name="price"]', '99.99');
    await page.fill('input[name="stock"]', '10');
    
    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click('text=Electronics');
    
    // Upload image (mock)
    // await page.setInputFiles('input[type="file"]', 'path/to/image.jpg');
    
    // Submit
    await page.click('button:has-text("Submit")');
    
    // Should show success or go to moderation
    await expect(page.locator('text=Product submitted|Moderation')).toBeVisible({ timeout: 5000 });
  });

  test('should view orders', async ({ page }) => {
    await page.goto('/seller/orders');
    
    // Should show orders list
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible({ timeout: 5000 });
  });

});
