// tests/scenario-3_cta-buttons.spec.js

const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────
// REGRESSION TEST — всі CTA-кнопки ведуть на /quiz.
// ⚠️ Всі CTA — Angular <button> з routerlink="/quiz", НЕ <a> теги.
//    getByRole('link') НЕ спрацює!
// ─────────────────────────────────────────────────────────────────

const QUIZ_URL = /\/quiz/;

test.describe('Scenario 3: All CTA buttons lead to quiz', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://dvrcres0lve.dev/');
    await page.waitForLoadState('networkidle');
  });

  // ── TC-3.1 ──────────────────────────────────────────────────────
  // Hero CTA "Check Eligibility" — above the fold, головна точка входу.
  test('TC-3.1 | Hero "Check Eligibility" leads to quiz', async ({ page }) => {
    const cta = page.locator('section[aria-label="Hero"] button')
      .filter({ hasText: 'Check Eligibility' });

    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(QUIZ_URL);
  });

  // ── TC-3.2 ──────────────────────────────────────────────────────
  // "Check Eligibility" в секції "How it works".
  test('TC-3.2 | "Check Eligibility" in How It Works leads to quiz', async ({ page }) => {
    const cta = page.locator('section[aria-label="How it works"] button')
      .filter({ hasText: 'Check Eligibility' });

    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(QUIZ_URL);
  });

  // ── TC-3.3 ──────────────────────────────────────────────────────
  // "Get Started" в секції Comparison/Pricing.
  test('TC-3.3 | "Get Started" in Comparison section leads to quiz', async ({ page }) => {
    const cta = page.locator('section[aria-label="Comparison"] button')
      .filter({ hasText: 'Get Started' });

    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(QUIZ_URL);
  });

  // ── TC-3.4 ──────────────────────────────────────────────────────
  // "Check eligibility" в секції Benefits (з маленької літери!).
  // ⚠️ Текст: "Check eligibility" (не "Check Eligibility") — використовуємо /i.
  test('TC-3.4 | "Check eligibility" in Benefits section leads to quiz', async ({ page }) => {
    const cta = page.locator('section[aria-label="Service benefits"] button')
      .filter({ hasText: /check eligibility/i });

    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(QUIZ_URL);
  });

});