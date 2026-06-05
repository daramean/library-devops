import { test, expect } from '@playwright/test';

test('Add Book modal submits and shows success toast', async ({ page }) => {
  // Navigate to admin books page
  await page.goto('http://localhost:3002/admin/books');

  // Open Add Book modal
  await page.click('button:has-text("Add Book")');

  // Fill basic required fields
  await page.fill('input[name="title"]', 'Playwright Test Book');
  await page.fill('input[name="author"]', 'E2E Tester');
  await page.fill('input[name="total_copies"]', '2');

  // Intercept POST to the API and return a mocked success response
  await page.route('**/api/v1/books', (route) => {
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'book-e2e-1', title: 'Playwright Test Book', author: 'E2E Tester' },
        errors: {}
      }),
    });
  });

  // Submit form
  await page.click('button:has-text("Add Book")');

  // Expect a success toast (react-hot-toast) or the modal to close
  await expect(page.locator('text=Book created successfully')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('text=Add Book')).toBeVisible();
});
