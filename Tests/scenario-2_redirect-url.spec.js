// tests/scenario-2_redirect-url.spec.js

const { test, expect } = require('@playwright/test');
const { completeQuiz } = require('./helpers/quiz.helper');

// ─────────────────────────────────────────────────────────────────
// CONTRACT TEST — перевіряє точність редиректу, а не просто факт.
// Воронка ЗАВЖДИ веде на крок registration на YourForms:
//   https://yrf0rms.dev/divorce/dr/quiz?step=registration
// Домен: yrf0rms.dev (staging) або yourforms.com (production).
//
// ОПТИМІЗАЦІЯ: воронка проходиться ОДИН раз у beforeAll (~50с), далі
// кожен тест робить швидку перевірку зафіксованого фінального URL.
// БЕЗ serial-режиму навмисно: перевірки незалежні (кожна лише читає finalUrl),
// тож падіння одного кейсу не має «пропускати» решту.
// ─────────────────────────────────────────────────────────────────

const YOURFORMS_DOMAIN = /yrf0rms\.dev|yourforms\.com/;
const QUIZ_PATH = '/divorce/dr/quiz';

test.describe('Scenario 2: Redirect URL validation', () => {
  let page;
  let finalUrl;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://dvrcres0lve.dev/');

    const heroCta = page.locator('section[aria-label="Hero"] button')
      .filter({ hasText: 'Check Eligibility' });
    await heroCta.click();
    await expect(page).toHaveURL(/\/quiz/);

    // completeQuiz завершується waitForURL на YourForms
    await completeQuiz(page);
    finalUrl = page.url();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── TC-2.1 ──────────────────────────────────────────────────────
  // Редирект веде на правильний домен.
  // Якщо падає: змінили домен без оновлення конфігу лендингу.
  test('TC-2.1 | Redirect domain is YourForms', () => {
    expect(new URL(finalUrl).hostname).toMatch(YOURFORMS_DOMAIN);
  });

  // ── TC-2.2 ──────────────────────────────────────────────────────
  // Редирект веде на шлях квізу /divorce/dr/quiz, а НЕ на головну.
  // ⭐ Якщо падає: юзер потрапляє на homepage YourForms → конверсія = 0.
  test('TC-2.2 | Redirect path leads to the YourForms quiz', () => {
    expect(new URL(finalUrl).pathname).toBe(QUIZ_PATH);
  });

  // ── TC-2.3 ──────────────────────────────────────────────────────
  // Воронка доходить саме до кроку registration (step=registration).
  // Якщо падає: користувач потрапив у проміжний/помилковий стан замість
  // фінального кроку реєстрації → лід не передано.
  test('TC-2.3 | Redirect lands on the registration step', () => {
    expect(new URL(finalUrl).searchParams.get('step')).toBe('registration');
  });

  // ── TC-2.4 ──────────────────────────────────────────────────────
  // Сторінка YourForms після редиректу реально завантажується.
  // Якщо падає: URL правильний але сторінка недоступна на стороні YourForms.
  test('TC-2.4 | YourForms registration page loads without errors', async () => {
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();
  });

});
