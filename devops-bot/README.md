
# 🤖 GOGOMARKET DevOps Bot

Telegram бот для мониторинга, тестирования и управления деплоем GOGOMARKET платформы.

## 🎯 Функционал

### Автоматический мониторинг
- ✅ Проверка доступности сайта каждые 5 минут
- ✅ E2E тестирование всего функционала каждые 4 часа
- ✅ Отслеживание ошибок и производительности
- ✅ Автоматические алерты при критических проблемах
- ✅ Автоматический откат через 1 час если админ не отвечает

### Тестирование
- 🧪 Полное E2E тестирование всех ролей (Клиент, Продавец, Курьер, Админ)
- 🔥 Критичные тесты (регистрация, корзина, оплата, заказы)
- 📊 Детальные отчеты о прохождении тестов
- ⚡ Запуск тестов по команде или по расписанию

### Управление деплоем
- 🚀 Деплой из любой ветки
- 🔄 Откат на предыдущую версию или конкретный коммит
- ✅ Тестирование на staging перед production
- 🔧 Режим обслуживания

### GitHub интеграция
- 📝 Просмотр коммитов и веток
- 🔀 Сравнение версий
- 🔄 Статус CI/CD
- 📬 Уведомления о push, PR, и деплоях

## 📦 Установка

### 1. Клонировать репозиторий

```bash
cd gogomarket/devops-bot
```

### 2. Установить зависимости

```bash
npm install
npm run install:browsers
```

### 3. Настроить переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
nano .env
```

**Обязательные переменные:**

```env
# Telegram Bot Token - получить от @BotFather
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Telegram Chat ID - ваш или групповой чат
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# GitHub Token - Personal Access Token с правами repo и workflow
GITHUB_TOKEN=your_github_token

# URLs
PRODUCTION_URL=https://gogomarket.com
STAGING_URL=https://staging.gogomarket.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/gogomarket
```

### 4. Создать Telegram бота

1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте токен в `.env`

**Получить Chat ID:**

```bash
# После того как напишете боту /start
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

### 5. Создать GitHub Token

1. Перейдите: https://github.com/settings/tokens
2. "Generate new token" → "Personal access token (classic)"
3. Выберите scopes: `repo`, `workflow`
4. Скопируйте токен в `.env`

### 6. Настроить GitHub Webhook (опционально)

Для получения уведомлений о коммитах и PR:

1. Настройки репозитория → Webhooks → Add webhook
2. Payload URL: `https://your-server.com/webhook/github`
3. Content type: `application/json`
4. Secret: создайте секрет и добавьте в `.env` как `GITHUB_WEBHOOK_SECRET`
5. Events: Push, Pull request, Workflow runs

### 7. Запустить бота

**Разработка:**
```bash
npm run dev
```

**Продакшн:**
```bash
npm start
```

**С PM2 (рекомендуется):**
```bash
npm install -g pm2
pm2 start src/index.js --name gogomarket-bot
pm2 save
pm2 startup
```

## 📱 Команды бота

### Мониторинг
- `/status` - Общий статус всех систем
- `/health` - Детальный health check
- `/report` - Отчет за 24 часа
- `/errors` - Последние ошибки

### Тестирование
- `/test_all` - Запустить все E2E тесты
- `/test_critical` - Только критичные тесты
- `/test [function]` - Проверить конкретную функцию

### Деплой
- `/deploy [branch]` - Деплой с тестами
- `/rollback` - Откатить на предыдущую версию
- `/rollback [commit]` - Откат на конкретный коммит
- `/maintenance on/off` - Режим обслуживания

### GitHub
- `/commits` - Последние коммиты
- `/branches` - Список веток
- `/compare [base] [head]` - Сравнить версии
- `/ci_status` - Статус CI/CD

## 🧪 Структура тестов

```
tests/e2e/
├── playwright.config.js          # Конфигурация Playwright
└── specs/
    ├── 01-client-auth.spec.js    # Регистрация, вход, выход
    ├── 02-catalog.spec.js        # Каталог, фильтры, поиск
    ├── 03-cart-checkout.spec.js  # Корзина и оформление заказа
    ├── 04-seller.spec.js         # Продавец: товары, заказы
    └── 05-admin.spec.js          # Админ панель
```

### Добавление новых тестов

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Test Suite', () => {
  
  test('should do something @critical', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GOGOMARKET/);
  });

});
```

**Теги:**
- `@critical` - критичные тесты, запускаются первыми

## 🔧 Настройка автоматики

### Расписание тестов

Редактируйте в `src/tests/scheduler.js`:

```javascript
// Каждые 4 часа (по умолчанию)
cron.schedule('0 */4 * * *', async () => { ... });

// Каждый час
cron.schedule('0 * * * *', async () => { ... });

// Каждый день в 2:00
cron.schedule('0 2 * * *', async () => { ... });
```

### Параметры автоотката

В `.env`:

```env
# Включить автоматический откат
AUTO_ROLLBACK_ENABLED=true

# Время ожидания ответа админа (в часах)
ROLLBACK_TIMEOUT_HOURS=1

# Критичное время ответа (в миллисекундах)
CRITICAL_RESPONSE_TIME_MS=3000
```

## 📊 Мониторинг

### Логи

```bash
# Просмотр логов
tail -f logs/devops-bot.log

# Только ошибки
tail -f logs/error.log

# С PM2
pm2 logs gogomarket-bot
```

### Метрики

Бот отслеживает:
- ⏱ Время ответа сайта
- 💾 Скорость запросов к БД
- ❌ Количество ошибок
- ✅ Uptime
- 📊 Результаты тестов

## 🚨 Обработка алертов

### Критичные алерты

```
🚨 CRITICAL ALERT!
❌ PRODUCTION IS DOWN!

⚠️ Auto-rollback will trigger in 1 hour
```

**Действия:**
1. Проверьте логи: `/errors`
2. Проверьте статус: `/status`
3. Если нужно - откатите: `/rollback`
4. Или исправьте и задеплойте: `/deploy fix-branch`

### Автоматический откат

Если админ не отвечает в течение 1 часа:
- ✅ Бот автоматически откатит на последнюю стабильную версию
- ✅ Запустит проверочные тесты
- ✅ Отправит уведомление о результате

**Отменить автооткат:**
```
/rollback  # Откатить вручную до таймаута
```

## 🔐 Безопасность

- ✅ Все токены и секреты в `.env` (не коммитить!)
- ✅ GitHub webhook проверяет подпись
- ✅ Только разрешенные админы могут управлять ботом
- ✅ Логи ошибок не содержат чувствительных данных

## 🐛 Troubleshooting

### Бот не запускается

```bash
# Проверьте .env файл
cat .env

# Проверьте логи
tail -f logs/devops-bot.log

# Проверьте зависимости
npm install
```

### Тесты не проходят

```bash
# Проверьте staging/production URL
curl https://staging.gogomarket.com/api/health

# Запустите тесты вручную
npm run test:e2e

# Проверьте тестовые данные
echo $TEST_USER_EMAIL
```

### GitHub интеграция не работает

- Проверьте токен: https://github.com/settings/tokens
- Проверьте права: repo, workflow
- Проверьте webhook подпись

## 📚 Документация

- [Playwright Documentation](https://playwright.dev/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

## 🤝 Поддержка

При проблемах:
1. Проверьте логи: `tail -f logs/devops-bot.log`
2. Проверьте статус: `/status` в боте
3. Проверьте конфигурацию: `.env`

---

**Разработано для GOGOMARKET Team** 🚀
