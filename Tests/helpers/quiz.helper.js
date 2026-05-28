// tests/helpers/quiz.helper.js

const { expect } = require('@playwright/test');

// ── Регулярний вираз для перевірки успішного завершення квізу ─────────────────
// Тест вважається успішним при переході на будь-який з цих URL:
//   - https://yrf0rms.dev/divorce/dr/quiz?step=registration
//   - https://yourforms.com/...
const SUCCESS_URL = /yrf0rms\.dev\/divorce\/dr\/quiz\?step=registration|yourforms\.com/;

// ── Клік Continue ────────────────────────────────────────────────────────────
async function clickContinue(page) {
  const btn = page.locator('.quiz__action button.large');
  await btn.waitFor({ state: 'visible' });
  await expect(btn).toBeEnabled({ timeout: 8000 });
  await btn.click();
}

// ── Клік по першій quiz-опції через координати ───────────────────────────────
async function clickFirstOption(page) {
  const option = page.locator('.quiz-step__option').first();
  await option.waitFor({ state: 'visible' });
  const box = await option.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

// ── Заповнення одного searchable-dropdown ────────────────────────────────────
// Структура: shared-ui-searchable-dropdown
//   └─ mat-form-field
//       └─ mat-mdc-form-field-infix
//           ├─ input.selector__input   ← видимий input для пошуку
//           └─ mat-select.selector     ← прихований (display:none)
//
// Стратегія:
//   1. Клікаємо input.selector__input — відкриває CDK overlay
//   2. Якщо передано searchText — вводимо його, щоб відфільтрувати список
//      (клік по довгому нефільтрованому списку — flaky)
//   3. Чекаємо mat-option в overlay
//   4. Клікаємо першу опцію через координати
// ─────────────────────────────────────────────────────────────────────────────
async function fillSearchableDropdown(page, dropdownLocator, searchText) {
  await dropdownLocator.waitFor({ state: 'visible' });

  const searchInput = dropdownLocator.locator('input.selector__input');
  await searchInput.waitFor({ state: 'visible' });

  // Клік по input відкриває панель опцій
  await searchInput.click();

  // Хардкодимо значення: вводимо назву, щоб звузити список до однієї опції
  // і детерміновано її вибрати.
  if (searchText) {
    await searchInput.fill(searchText);
    await page.waitForTimeout(500);
  }

  // Чекаємо появи опцій в CDK overlay
  const firstOption = page.locator('.cdk-overlay-container mat-option').first();
  await firstOption.waitFor({ state: 'visible', timeout: 5000 });

  // Клікаємо через координати — надійніше для Angular CDK
  const box = await firstOption.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Чекаємо закриття overlay
  await page
    .waitForSelector('.cdk-overlay-container mat-option', {
      state: 'hidden',
      timeout: 3000,
    })
    .catch(() => {});

  await page.waitForTimeout(300);
}

// ── Заповнення всіх searchable-dropdown на кроці ─────────────────────────────
// КЛЮЧОВА ЛОГІКА:
//   - Заповнюємо перший dropdown (state)
//   - Після вибору Angular робить API запит і рендерить county dropdown
//   - Чекаємо появи другого dropdown через waitForFunction
//   - Ontario/Quebec не мають county — .catch() не ламає тест
// ─────────────────────────────────────────────────────────────────────────────
async function fillAllDropdowns(page) {
  // Крок 1: перший dropdown — штат, хардкодимо "Alabama"
  const firstDropdown = page.locator('shared-ui-searchable-dropdown').first();
  await fillSearchableDropdown(page, firstDropdown, 'Alabama');

  // Чекаємо поки Angular зробить API запит і відрендерить county dropdown
  // Ознака появи: кількість shared-ui-searchable-dropdown стає >= 2
  await page
    .waitForFunction(
      () => document.querySelectorAll('shared-ui-searchable-dropdown').length >= 2,
      { timeout: 5000 }
    )
    .catch(() => {
      // Деякі штати (Ontario, Quebec) не мають county — продовжуємо без помилки
    });

  // Перевіряємо скільки dropdown зараз є на сторінці
  const count = await page.locator('shared-ui-searchable-dropdown').count();

  // Крок 2+: заповнюємо решту dropdown (county та інші якщо є)
  for (let i = 1; i < count; i++) {
    const dropdown = page.locator('shared-ui-searchable-dropdown').nth(i);

    // Чекаємо поки dropdown стане видимим (може рендеритись з затримкою)
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });

    // Пауза щоб Angular завершив завантаження опцій через API
    await page.waitForTimeout(500);

    // Другий dropdown — county, хардкодимо "Autauga" (перше графство Алабами)
    await fillSearchableDropdown(page, dropdown, 'Autauga');
  }
}

// ── Заповнення форми з іменем ─────────────────────────────────────────────────
// Структура з HTML:
//   input[data-testid="quiz-input-first_name"]  ← First Name
//   input[data-testid="quiz-input-last_name"]   ← Last Name
//
// Логіка:
//   1. Клікаємо в поле First Name → вводимо "Test"
//   2. Клікаємо в поле Last Name  → вводимо "User"
//   3. Чекаємо поки Angular валідує форму → кнопка стає enabled
//   4. Клікаємо Continue по data-testid
// ─────────────────────────────────────────────────────────────────────────────
async function fillNameForm(page) {
  // Чекаємо появи форми перед будь-якими діями
  await page.waitForSelector('[data-testid="quiz-input-first_name"]', {
    state: 'visible',
    timeout: 5000,
  });

  // First Name → "Test"
  const firstNameInput = page.locator('[data-testid="quiz-input-first_name"]');
  await firstNameInput.click();
  await firstNameInput.fill('Test');

  // Last Name → "User"
  const lastNameInput = page.locator('[data-testid="quiz-input-last_name"]');
  await lastNameInput.click();
  await lastNameInput.fill('User');

  // Чекаємо поки Angular валідує форму і кнопка стає enabled
  const btn = page.locator('[data-testid="quiz-form-continue-btn"]');
  await btn.waitFor({ state: 'visible' });
  await expect(btn).toBeEnabled({ timeout: 8000 });
  await btn.click();
}

// ── Перевірка чи поточний URL є успішним ─────────────────────────────────────
function isSuccessUrl(url) {
  return SUCCESS_URL.test(url);
}

// ── Один крок квізу ───────────────────────────────────────────────────────────
async function doStep(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);

  // Перевіряємо успішний URL перед будь-якими діями
  if (isSuccessUrl(page.url())) return 'redirect';

  // Крок "analyzing" — екран обробки відповідей. Залежно від таймінгу беку він
  // АБО сам редіректить на YourForms, АБО лишає активну кнопку Continue, яку
  // треба натиснути. Чекаємо редірект; якщо його немає — тиснемо Continue.
  if (/[?&]step=analyzing/.test(page.url())) {
    const redirected = await page
      .waitForURL(SUCCESS_URL, { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (!redirected) {
      await page.locator('.quiz__action button.large').click().catch(() => {});
      await page.waitForURL(SUCCESS_URL, { timeout: 20000 });
    }
    return 'redirect';
  }

  const result = await Promise.race([
    page
      .waitForSelector('.quiz-step__option', { timeout: 3000 })
      .then(() => 'options'),
    page
      .waitForSelector('shared-ui-searchable-dropdown', { timeout: 3000 })
      .then(() => 'searchable-dropdown'),
    // Детектуємо форму з іменем по точному data-testid
    page
      .waitForSelector('[data-testid="quiz-input-first_name"]', { timeout: 3000 })
      .then(() => 'name-form'),
    // Детектуємо одиночний email input
    page
      .waitForSelector('input[type="email"]', { timeout: 3000 })
      .then(() => 'email-form'),
  ]).catch(() => 'continue');

  // ── options: клік по першій опції → автоперехід
  if (result === 'options') {
    await clickFirstOption(page);
    await page.waitForURL(/step=/, { timeout: 5000 }).catch(() => {});
    return 'options';
  }

  // ── searchable-dropdown: заповнюємо всі dropdown → Continue
  if (result === 'searchable-dropdown') {
    await fillAllDropdowns(page);
    await clickContinue(page);
    return 'searchable-dropdown';
  }

  // ── name-form: First Name = "Test", Last Name = "User" → Continue
  // fillNameForm сам клікає Continue — не викликаємо clickContinue окремо
  if (result === 'name-form') {
    await fillNameForm(page);
    return 'name-form';
  }

  // ── email-form: одне поле email → Continue
  if (result === 'email-form') {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.click();
    await emailInput.fill('test@test.com');
    await clickContinue(page);
    return 'email-form';
  }

  // ── проміжний екран: тільки Continue
  await clickContinue(page);
  return 'continue';
}

// ── Повний квіз ───────────────────────────────────────────────────────────────
async function completeQuiz(page) {
  // Крок 0: INTRO — тільки Continue
  await clickContinue(page);

  // Кроки 1..N
  for (let i = 0; i < 40; i++) {
    const stepResult = await doStep(page);
    if (stepResult === 'redirect') break;
    if (isSuccessUrl(page.url())) break;
  }

  // Тест успішний якщо досягнуто step=registration або yourforms.com
  await page.waitForURL(SUCCESS_URL, { timeout: 15000 });
}

module.exports = {
  completeQuiz,
  clickContinue,
  clickFirstOption,
  doStep,
  fillSearchableDropdown,
  fillAllDropdowns,
  fillNameForm,
  isSuccessUrl,
};