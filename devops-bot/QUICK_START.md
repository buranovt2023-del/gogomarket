# 🚀 Быстрый старт DevOps Bot

## За 5 минут

### 1️⃣ Создайте Telegram бота

```
1. Найдите @BotFather в Telegram
2. Отправьте: /newbot
3. Введите имя: GOGOMARKET DevOps Bot
4. Введите username: gogomarket_devops_bot (или другой)
5. Скопируйте токен
```

### 2️⃣ Получите Chat ID

```
1. Напишите вашему боту: /start
2. Откройте: https://api.telegram.org/bot<TOKEN>/getUpdates
3. Найдите "chat":{"id": XXXXXXXXX
4. Скопируйте число
```

### 3️⃣ Создайте GitHub Token

```
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Выберите: repo, workflow
4. Generate и скопируйте
```

### 4️⃣ Настройте .env

```bash
cd gogomarket/devops-bot
cp .env.example .env
nano .env
```

Заполните минимум:
```
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather
TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
GITHUB_TOKEN=ваш_github_token
PRODUCTION_URL=https://gogomarket.com
```

### 5️⃣ Установите и запустите

```bash
npm install
npm run install:browsers
npm start
```

## ✅ Готово!

Напишите боту `/help` чтобы увидеть все команды.

### Проверка работы

```
/status - Проверить статус системы
/test_critical - Запустить критичные тесты
```

## 📱 Основные команды

```
/status          - Статус системы
/test_all        - Все тесты
/deploy main     - Деплой main
/rollback        - Откат
/commits         - Последние коммиты
```

## 🔥 Что работает автоматически

- ✅ Мониторинг каждые 5 минут
- ✅ E2E тесты каждые 4 часа
- ✅ Алерты при ошибках
- ✅ Автооткат через 1 час при критических проблемах

## 🆘 Проблемы?

```bash
# Проверьте логи
tail -f logs/devops-bot.log

# Перезапустите
npm start

# PM2 (для продакшн)
npm install -g pm2
pm2 start src/index.js --name gogomarket-bot
pm2 save
```

---

**Всё! Бот работает!** 🎉
