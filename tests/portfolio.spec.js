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

  test('should open interactive terminal modal and execute help command', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const termBtn = page.locator('#terminal-trigger');
    await termBtn.click();
    await expect(page.locator('#terminal-modal')).toHaveClass(/show/);
    const termInput = page.locator('#terminal-input');
    await termInput.fill('help');
    await termInput.press('Enter');
    await expect(page.locator('#terminal-output')).toContainText('Available Commands');
  });
});
