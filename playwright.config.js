const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  // E2E проти живого сайту з headless:false — кілька паралельних браузерів
  // конкурують за ресурси та повільні API-запити (county dropdown тощо),
  // через що кроки стають flaky. Виконуємо тести послідовно.
  workers: 1,
  use: {
    headless: false,
    baseURL: 'https://dvrcres0lve.dev',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});