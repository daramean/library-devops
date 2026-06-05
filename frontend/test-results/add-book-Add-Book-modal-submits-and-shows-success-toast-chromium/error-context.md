# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-book.spec.ts >> Add Book modal submits and shows success toast
- Location: e2e\add-book.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Add Book")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e10]: OBITO STORE
    - generic [ref=e11]:
      - heading "Your library, always open." [level=1] [ref=e12]:
        - text: Your library,
        - text: always open.
      - paragraph [ref=e13]: Manage books, borrows and returns with a modern system.
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: 10K+
        - generic [ref=e17]: Books
      - generic [ref=e18]:
        - generic [ref=e19]: 500+
        - generic [ref=e20]: Members
      - generic [ref=e21]:
        - generic [ref=e22]: 99.9%
        - generic [ref=e23]: Uptime
  - generic [ref=e25]:
    - heading "Sign in" [level=2] [ref=e26]
    - paragraph [ref=e27]: Welcome back — enter your credentials
    - generic [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]: Email
        - generic [ref=e31]:
          - img [ref=e32]
          - textbox "you@example.com" [ref=e35]
      - generic [ref=e36]:
        - generic [ref=e37]: Password
        - generic [ref=e38]:
          - img [ref=e39]
          - textbox "••••••••" [ref=e42]
          - button [ref=e43] [cursor=pointer]:
            - img [ref=e44]
      - button "Sign In" [ref=e47] [cursor=pointer]
    - paragraph [ref=e48]:
      - text: Don't have an account?
      - link "Register" [ref=e49] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Add Book modal submits and shows success toast', async ({ page }) => {
  4  |   // Navigate to admin books page
  5  |   await page.goto('http://localhost:3002/admin/books');
  6  | 
  7  |   // Open Add Book modal
> 8  |   await page.click('button:has-text("Add Book")');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  9  | 
  10 |   // Fill basic required fields
  11 |   await page.fill('input[name="title"]', 'Playwright Test Book');
  12 |   await page.fill('input[name="author"]', 'E2E Tester');
  13 |   await page.fill('input[name="total_copies"]', '2');
  14 | 
  15 |   // Intercept POST to the API and return a mocked success response
  16 |   await page.route('**/api/v1/books', (route) => {
  17 |     route.fulfill({
  18 |       status: 201,
  19 |       contentType: 'application/json',
  20 |       body: JSON.stringify({
  21 |         success: true,
  22 |         data: { id: 'book-e2e-1', title: 'Playwright Test Book', author: 'E2E Tester' },
  23 |         errors: {}
  24 |       }),
  25 |     });
  26 |   });
  27 | 
  28 |   // Submit form
  29 |   await page.click('button:has-text("Add Book")');
  30 | 
  31 |   // Expect a success toast (react-hot-toast) or the modal to close
  32 |   await expect(page.locator('text=Book created successfully')).toBeVisible({ timeout: 3000 });
  33 |   await expect(page.locator('text=Add Book')).toBeVisible();
  34 | });
  35 | 
```