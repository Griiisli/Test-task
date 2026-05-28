# Test-task

E2E-тести (Playwright) для воронки квізу `dvrcres0lve.dev` → редірект на YourForms.

## Структура

```
playwright.config.js          # конфіг (testDir, timeout, workers)
Tests/
  scenario-1_happy-path.spec.js   # повний прохід квізу до редіректу
  scenario-2_redirect-url.spec.js # валідація URL редіректу
  scenario-3_cta-buttons.spec.js  # всі CTA-кнопки ведуть на /quiz
  helpers/quiz.helper.js          # логіка проходження квізу
```

## Вимоги

- Node.js 18+
- Playwright 1.58+ (ставиться через `npx`, окремий `package.json` не потрібен)

## Встановлення браузерів

Перед першим запуском треба завантажити браузер Chromium:

```bash
npx playwright install chromium
```

## Запуск тестів

Усі тести:

```bash
npx playwright test
```

Окремий сценарій:

```bash
npx playwright test scenario-1          # тільки happy path
npx playwright test scenario-2 scenario-3
```

Один конкретний тест-кейс:

```bash
npx playwright test -g "TC-1.4"
```

## Корисні прапорці

```bash
npx playwright test --headed     # показувати браузер (за замовчуванням headless:false)
npx playwright test --debug      # покроковий дебаг (Playwright Inspector)
npx playwright show-report       # відкрити HTML-звіт останнього запуску
```

## Примітки

- Тести працюють проти **живого** сайту `https://dvrcres0lve.dev/`, тож потрібен інтернет.
- `workers: 1` — тести виконуються послідовно: кілька паралельних браузерів проти живого
  сайту конкурують за ресурси й повільні API-запити, через що кроки стають нестабільними.
- `timeout: 120000` — повний прохід воронки триває ~50 секунд.
- У dropdown штату/графства захардкоджено **Alabama** → **Autauga** для детермінованого вибору.

## Знайдені проблеми

Під час тестування воронки виявлено такі проблеми:

1. **Нестабільний searchable-dropdown (штат → графство, крок `q5`).**
   Після вибору штату підвантажується dropdown графства, але вибір опції не
   завжди реєструється — кнопка Continue лишається `disabled`, і користувач
   застрягає на кроці. У тестах обійдено хардкодом значень (Alabama → Autauga)
   з вводом тексту для фільтрації списку.

2. **Непослідовна поведінка кроку `analyzing`.**
   Інколи крок сам редіректить на YourForms, інколи лишає активну кнопку
   Continue, яку треба натиснути вручну. Час до редіректу теж нестабільний
   (від кількох секунд до десятків). Це ускладнює автоматизацію та може
   збивати з пантелику живих користувачів.

3. **Редірект веде на `?step=registration`, а не на сторінку pricing.**
   Фінальний редірект потрапляє на `https://yrf0rms.dev/divorce/dr/quiz?step=registration`
   (сторінка створення акаунта / email), тоді як очікувалося
   `/divorce/dr/quiz/pricing` з параметром сесії `h`. Через це падають
   `TC-2.2` та `TC-2.3` — реальний пункт призначення воронки не збігається
   з очікуваним.
