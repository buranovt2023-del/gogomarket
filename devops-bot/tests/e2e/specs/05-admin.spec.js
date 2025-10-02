
const { test, expect } = require('@playwright/test');

test.describe('Admin Panel', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@gogomarket.com');
    await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(|dashboard|admin)/);
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin dashboard
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Moderation')).toBeVisible();
    await expect(page.locator('text=Categories')).toBeVisible();
  });

  test('should view users', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Should show users list
    await expect(page.locator('[data-testid="user-item"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should view moderation queue', async ({ page }) => {
    await page.goto('/admin/moderation');
    
    // Should show moderation items
    await expect(page).toHaveURL(/\/admin\/moderation/);
  });

});
