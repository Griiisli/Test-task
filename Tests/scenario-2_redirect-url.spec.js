// tests/scenario-2_redirect-url.spec.js

const { test, expect } = require('@playwright/test');
const { completeQuiz } = require('./helpers/quiz.helper');

// ─────────────────────────────────────────────────────────────────
// CONTRACT TEST — перевіряє точність редиректу, а не просто факт.
// Домен: yrf0rms.dev (staging) або yourforms.com (production).
// ─────────────────────────────────────────────────────────────────

const YOURFORMS_DOMAIN = /yrf0rms\.dev|yourforms\.com/;

async function goToQuizAndComplete(page) {
  await page.goto('https://dvrcres0lve.dev/');
  await page.waitForLoadState('networkidle');

  const heroCta = page.locator('section[aria-label="Hero"] button')
    .filter({ hasText: 'Check Eligibility' });
  await heroCta.click();
  await expect(page).toHaveURL(/\/quiz/);
  await page.waitForLoadState('networkidle');

  // completeQuiz завершується waitForURL на YourForms
  await completeQuiz(page);
}

test.describe('Scenario 2: Redirect URL validation', () => {

  // ── TC-2.1 ──────────────────────────────────────────────────────
  // Редирект веде на правильний домен.
  // Якщо падає: змінили домен без оновлення конфігу лендингу.
  test('TC-2.1 | Redirect domain is YourForms', async ({ page }) => {
    await goToQuizAndComplete(page);

    const url = new URL(page.url());
    expect(url.hostname).toMatch(YOURFORMS_DOMAIN);
  });

  // ── TC-2.2 ──────────────────────────────────────────────────────
  // Редирект веде на /divorce/dr/quiz/pricing, а НЕ на головну.
  // ⭐ Якщо падає: юзер потрапляє на homepage YourForms → конверсія = 0.
  test('TC-2.2 | Redirect path leads to pricing page', async ({ page }) => {
    await goToQuizAndComplete(page);

    const url = new URL(page.url());
    expect(url.pathname).toBe('/divorce/dr/quiz/pricing');
  });

  // ── TC-2.3 ──────────────────────────────────────────────────────
  // URL містить query-параметр `h` (динамічний UUID сесії).
  // Перевіряємо наявність параметра, а НЕ конкретне значення.
  // Якщо падає: YourForms не отримує ідентифікатор сесії → помилка на pricing.
  test('TC-2.3 | Redirect URL contains session parameter "h"', async ({ page }) => {
    await goToQuizAndComplete(page);

    const url = new URL(page.url());
    expect(url.searchParams.has('h')).toBeTruthy();
  });

  // ── TC-2.4 ──────────────────────────────────────────────────────
  // Сторінка YourForms після редиректу реально завантажується.
  // Якщо падає: URL правильний але сторінка недоступна на стороні YourForms.
  test('TC-2.4 | YourForms pricing page loads without errors', async ({ page }) => {
    await goToQuizAndComplete(page);

    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();
  });

});