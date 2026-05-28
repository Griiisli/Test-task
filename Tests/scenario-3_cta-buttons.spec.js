// tests/scenario-3_cta-buttons.spec.js

const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────
// REGRESSION TEST — всі CTA-кнопки ведуть на /quiz.
// ⚠️ Всі CTA — Angular <button> з routerlink="/quiz", НЕ <a> теги.
//    getByRole('link') НЕ спрацює!
//
// Кейси data-driven: один шаблон по масиву CTA замість 4 копій.
// ─────────────────────────────────────────────────────────────────

const QUIZ_URL = /\/quiz/;

// Кожна точка входу у воронку: секція (aria-label) + текст кнопки.
// ⚠️ TC-3.4 — "Check eligibility" з маленької літери → regex /i.
const CTAS = [
  { id: 'TC-3.1', label: 'Hero "Check Eligibility"',                section: 'Hero',             text: 'Check Eligibility' },
  { id: 'TC-3.2', label: '"Check Eligibility" in How It Works',     section: 'How it works',     text: 'Check Eligibility' },
  { id: 'TC-3.3', label: '"Get Started" in Comparison section',     section: 'Comparison',       text: 'Get Started' },
  { id: 'TC-3.4', label: '"Check eligibility" in Benefits section', section: 'Service benefits', text: /check eligibility/i },
];

test.describe('Scenario 3: All CTA buttons lead to quiz', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://dvrcres0lve.dev/');
  });

  for (const cta of CTAS) {
    test(`${cta.id} | ${cta.label} leads to quiz`, async ({ page }) => {
      const button = page.locator(`section[aria-label="${cta.section}"] button`)
        .filter({ hasText: cta.text });

      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      await button.click();

      await expect(page).toHaveURL(QUIZ_URL);
    });
  }

});
