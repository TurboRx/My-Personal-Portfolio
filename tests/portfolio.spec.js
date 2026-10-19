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

  test('should open command palette modal and search', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const cmdBtn = page.locator('#cmd-k-trigger');
    await cmdBtn.click();
    await expect(page.locator('#cmd-palette-modal')).toHaveClass(/show/);
    const cmdInput = page.locator('#cmd-palette-input');
    await cmdInput.fill('skills');
    await expect(page.locator('#cmd-palette-results')).not.toBeEmpty();
  });

  test('should enforce Content-Security-Policy meta tag', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toHaveCount(1);
    const content = await cspMeta.getAttribute('content');
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("object-src 'none'");
  });
});
