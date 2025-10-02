
const { test, expect } = require('@playwright/test');

test.describe('Client Authentication', () => {
  
  test('should load homepage @critical', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GOGOMARKET/i);
  });

  test('should register new client @critical', async ({ page }) => {
    await page.goto('/auth/register');
    
    const uniqueEmail = `test+${Date.now()}@gogomarket.com`;
    
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="phone"]', `+99899${Math.floor(Math.random() * 10000000)}`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    await page.click('button[type="submit"]');
    
    // Should show SMS verification page
    await expect(page).toHaveURL(/\/auth\/verify/);
    await expect(page.locator('text=Enter verification code')).toBeVisible();
  });

  test('should login existing client @critical', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    
    await page.click('button[type="submit"]');
    
    // Should redirect to homepage or dashboard
    await expect(page).toHaveURL(/\/(|dashboard)/);
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should logout @critical', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/(|dashboard)/);
    
    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Login')).toBeVisible();
  });

});
