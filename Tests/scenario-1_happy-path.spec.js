// tests/scenario-1_happy-path.spec.js

const { test, expect } = require('@playwright/test');
const { completeQuiz } = require('./helpers/quiz.helper');

// ─────────────────────────────────────────────────────────────────
// SMOKE TEST — якщо цей сценарій падає, решта не має сенсу.
// Перевіряє повну конверсійну воронку: лендинг → квіз → редирект.
// ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://dvrcres0lve.dev/';
const HERO_CTA = 'section[aria-label="Hero"] button';
const YOURFORMS = /yrf0rms\.dev|yourforms\.com/;

test.describe('Scenario 1: Happy Path — full quiz flow to redirect', () => {

  // ── TC-1.1 ──────────────────────────────────────────────────────
  // Лендинг завантажується і hero CTA кнопка присутня.
  // ⚠️ CTA — це Angular <button>, НЕ <a> тег → getByRole('link') не працює.
  // Якщо падає: сайт недоступний або зламана верстка hero-секції.
  test('TC-1.1 | Landing page loads and hero CTA is visible', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page).toHaveTitle(/DivorceResolve/i);

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await expect(heroCta).toBeVisible();
  });

  // ── TC-1.2 ──────────────────────────────────────────────────────
  // Перший крок квізу (Intro) рендериться коректно після кліку hero CTA.
  // Навігація hero → /quiz перевіряється тут (а також у scenario-3 для всіх CTA),
  // тому окремого тесту лише на навігацію не тримаємо.
  // Якщо падає: маршрут /quiz зламаний або JS-помилка блокує рендер intro.
  test('TC-1.2 | Quiz intro step renders correctly', async ({ page }) => {
    await page.goto(BASE_URL);

    const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
    await heroCta.click();
    await expect(page).toHaveURL(/\/quiz/);

    // Continue кнопка має бути видима та активна на intro-кроці
    const continueBtn = page.locator('.quiz__action button.large');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeEnabled();

    // Немає error-стану
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();
  });

  // ── TC-1.3 / TC-1.4 ─────────────────────────────────────────────
  // ОПТИМІЗАЦІЯ: повний прохід квізу виконується ОДИН раз у beforeAll
  // (~50с), а не двічі. Якщо прохід зламано (beforeAll кидає) — обидва кейси
  // падають; перевірки незалежні, тож одна не «пропускає» іншу.
  test.describe('Full quiz traversal (single run)', () => {
    let page;
    let finalUrl;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await page.goto(BASE_URL);

      const heroCta = page.locator(HERO_CTA).filter({ hasText: 'Check Eligibility' });
      await heroCta.click();
      await expect(page).toHaveURL(/\/quiz/);

      await completeQuiz(page);
      finalUrl = page.url();
    });

    test.afterAll(async () => {
      await page.close();
    });

    // Користувач може пройти всі кроки квізу без помилок.
    // Якщо падає: один з кроків зламаний — дивись stack trace у beforeAll.
    test('TC-1.3 | User can complete all quiz steps', () => {
      expect(finalUrl).toMatch(YOURFORMS);
    });

    // ⭐ Найважливіший тест — перевіряє що воронка конвертує.
    // Якщо падає: редирект зламаний → нульова конверсія.
    test('TC-1.4 | After quiz completion user is redirected to YourForms', () => {
      expect(new URL(finalUrl).hostname).toMatch(YOURFORMS);
    });
  });

});
