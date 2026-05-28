// tests/scenario-1_happy-path.spec.js

const { test, expect } = require('@playwright/test');
const { completeQuiz } = require('./helpers/quiz.helper');

// ─────────────────────────────────────────────────────────────────
// SMOKE TEST — якщо цей сценарій падає, решта не має сенсу.
// Перевіряє повну конверсійну воронку: лендинг → квіз → редирект.
// ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://dvrcres0lve.dev/';
const HERO_CTA = 'section[aria-label="Hero"] button';

test.describe('Scenario 1: Happy Path — full quiz flow to redirect', () => {

  // ── TC-1.1 ──────────────────────────────────────────────────────
  // Лендинг завантажується і hero CTA кнопка присутня.
  // ⚠️ CTA — це Angular <button>, НЕ <a> тег → getByRole('link') не працює.
  // Якщо падає: сайт недоступний або зламана верстка hero-секції.
  test('TC-1.1 | Landing page loads and hero CTA is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/DivorceResolve/i);

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await expect(heroCta).toBeVisible();
  });

  // ── TC-1.2 ──────────────────────────────────────────────────────
  // Клік по hero CTA навігує на /quiz.
  // Angular router → waitForURL замість waitForNavigation.
  // Якщо падає: routerLink="/quiz" зламаний або змінили маршрут.
  test('TC-1.2 | Click hero CTA navigates to /quiz', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await heroCta.click();

    await expect(page).toHaveURL(/\/quiz/);
  });

  // ── TC-1.3 ──────────────────────────────────────────────────────
  // Перший крок квізу (Intro) рендериться коректно.
  // Якщо падає: квіз завантажується але JS-помилка блокує рендер.
  test('TC-1.3 | Quiz intro step renders correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await heroCta.click();
    await expect(page).toHaveURL(/\/quiz/);
    await page.waitForLoadState('networkidle');

    // Continue кнопка має бути видима на intro-кроці
    const continueBtn = page.locator('.quiz__action button.large');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeEnabled();

    // Немає error-стану
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();
  });

  // ── TC-1.4 ──────────────────────────────────────────────────────
  // Користувач може пройти всі 22 кроки квізу без помилок.
  // Якщо падає: один з кроків зламаний — дивись stack trace на якому кроці.
  test('TC-1.4 | User can complete all quiz steps', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await heroCta.click();
    await expect(page).toHaveURL(/\/quiz/);
    await page.waitForLoadState('networkidle');

    await completeQuiz(page);
  });

  // ── TC-1.5 ──────────────────────────────────────────────────────
  // Після завершення квізу відбувається редирект на YourForms.
  // ⭐ Найважливіший тест — перевіряє що воронка конвертує.
  // Якщо падає: редирект зламаний → нульова конверсія.
  test('TC-1.5 | After quiz completion user is redirected to YourForms', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await heroCta.click();
    await expect(page).toHaveURL(/\/quiz/);
    await page.waitForLoadState('networkidle');

    await completeQuiz(page);

    // completeQuiz вже чекає на редирект всередині,
    // але явно перевіряємо фінальний домен
    await expect(page).toHaveURL(/yrf0rms\.dev|yourforms\.com/);
  });

});