
# Настройка CI/CD для GOGOMARKET

## Обзор

Проект настроен с полным CI/CD пайплайном использующим GitHub Actions для автоматизации тестирования, сборки и деплоя.

## Созданные Workflows

### 1. CI Pipeline (`ci.yml`)

**Триггеры**: Push в `main` и `feature/*` ветки, Pull Requests в `main`

**Jobs**:
- **Lint and Type Check**: Проверка кода ESLint и TypeScript
- **Build**: Сборка Next.js приложения
- **Test**: Запуск тестов с PostgreSQL
- **Security Scan**: Проверка уязвимостей и секретов

### 2. Deploy Preview (`deploy-preview.yml`)

**Триггер**: Pull Requests в `main`

**Функционал**: Создание preview окружения для тестирования изменений перед мержем

### 3. Deploy Production (`deploy-production.yml`)

**Триггеры**: Push в `main`, Manual trigger

**Функционал**: Автоматический деплой в продакшн после мержа в main ветку

### 4. Database Backup (`database-backup.yml`)

**Триггер**: Ежедневно в 2:00 UTC, Manual trigger

**Функционал**: Автоматическое создание бэкапов базы данных

## Необходимые GitHub Secrets

Для работы CI/CD необходимо настроить следующие секреты в Settings → Secrets and variables → Actions:

### Для Preview окружения:
- `PREVIEW_URL` - URL preview окружения
- `PREVIEW_DATABASE_URL` - URL базы данных для preview
- `NEXTAUTH_SECRET` - Секрет для NextAuth

### Для Production окружения:
- `PRODUCTION_URL` - URL продакшн сайта
- `PRODUCTION_DATABASE_URL` - URL продакшн базы данных
- `NEXTAUTH_SECRET` - Секрет для NextAuth

## Дополнительные файлы

### CODEOWNERS
Автоматическое назначение ревьюеров для Pull Requests

### Pull Request Template
Шаблон для создания единообразных PR с необходимой информацией

### Issue Templates
- **Bug Report**: Для сообщения о багах
- **Feature Request**: Для предложения новых функций

## Как использовать

### Разработка новой функции

1. Создайте feature ветку:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Внесите изменения и закоммитьте:
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. Отправьте в GitHub:
   ```bash
   git push origin feature/new-feature
   ```

4. CI автоматически запустится и проверит ваш код

5. Создайте Pull Request
   - CI запустится снова
   - Preview окружение будет создано (после настройки)
   - Дождитесь ревью и одобрения

6. После мержа в main:
   - Автоматически запустится деплой в продакшн
   - Код будет протестирован и задеплоен

### Ручной деплой

Вы можете запустить деплой вручную:
1. Перейдите в Actions
2. Выберите "Deploy to Production"
3. Нажмите "Run workflow"
4. Выберите ветку и запустите

## Статус билдов

Статус последних билдов можно посмотреть в разделе Actions на GitHub или в бейджах в README (после добавления).

## Мониторинг

- GitHub Actions предоставляет логи всех запусков
- Email уведомления о неудачных билдах
- Можно настроить интеграцию со Slack/Telegram для уведомлений

## Следующие шаги

1. **Настроить секреты** в GitHub Settings
2. **Выбрать хостинг-провайдер** (Vercel, AWS, DigitalOcean, etc.)
3. **Настроить интеграцию деплоя** в workflow файлах
4. **Настроить backup хранилище** для бэкапов БД
5. **Добавить тесты** в проект для автоматического тестирования
6. **Настроить мониторинг** и уведомления

## Документация

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Примечание**: Некоторые шаги в workflows содержат заглушки и требуют настройки под конкретное окружение и хостинг-провайдера.
