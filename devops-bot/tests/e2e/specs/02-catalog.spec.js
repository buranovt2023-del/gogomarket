
const { test, expect } = require('@playwright/test');

test.describe('Product Catalog', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display categories @critical', async ({ page }) => {
    await page.goto('/catalog');
    
    // Should show categories
    await expect(page.locator('[data-testid="category-item"]').first()).toBeVisible();
    
    // Should have at least 3 categories
    const categoryCount = await page.locator('[data-testid="category-item"]').count();
    expect(categoryCount).toBeGreaterThan(2);
  });

  test('should filter products @critical', async ({ page }) => {
    await page.goto('/catalog');
    
    // Apply price filter
    await page.fill('input[name="minPrice"]', '100');
    await page.fill('input[name="maxPrice"]', '1000');
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Should show filtered products
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await page.goto('/catalog');
    
    // Search
    await page.fill('input[placeholder*="Search"]', 'phone');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Should show search results
    const results = page.locator('[data-testid="product-card"]');
    await expect(results.first()).toBeVisible();
  });

  test('should open product details', async ({ page }) => {
    await page.goto('/catalog');
    
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Should show product details
    await expect(page).toHaveURL(/\/product\/[^/]+/);
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
  });

});
