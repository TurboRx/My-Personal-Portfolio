const { test, expect } = require('@playwright/test');

test.describe('Portfolio E2E Tests', () => {
  test('should load portfolio title and profile header', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    await expect(page).toHaveTitle(/TurboRx - Developer Portfolio/);
    await expect(page.locator('#profile-name')).toHaveText('TurboRx');
  });

  test('should toggle theme dropdown', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const themeBtn = page.locator('#theme-toggle-btn');
    await themeBtn.click();
    await expect(page.locator('#theme-dropdown')).toHaveClass(/show/);
  });
});
