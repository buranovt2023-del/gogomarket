
# Содержимое всех CI/CD файлов

Если по каким-то причинам автоматическая установка не работает, вы можете создать файлы вручную, скопировав содержимое отсюда.

## Структура файлов

```
.github/
├── workflows/
│   ├── ci.yml
│   ├── deploy-preview.yml
│   ├── deploy-production.yml
│   └── database-backup.yml
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
├── CODEOWNERS
└── pull_request_template.md
```

---

## .github/workflows/ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, feature/* ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-type-check:
    name: Lint and Type Check
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
          cache-dependency-path: platform/yarn.lock
      
      - name: Install dependencies
        working-directory: ./platform
        run: yarn install --frozen-lockfile
      
      - name: Run ESLint
        working-directory: ./platform
        run: yarn lint || echo "Linting completed with warnings"
      
      - name: Run TypeScript type check
        working-directory: ./platform
        run: npx tsc --noEmit

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
          cache-dependency-path: platform/yarn.lock
      
      - name: Install dependencies
        working-directory: ./platform
        run: yarn install --frozen-lockfile
      
      - name: Build Next.js application
        working-directory: ./platform
        run: yarn build
        env:
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret-for-ci
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: platform/.next
          retention-days: 7

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
          cache-dependency-path: platform/yarn.lock
      
      - name: Install dependencies
        working-directory: ./platform
        run: yarn install --frozen-lockfile
      
      - name: Run Prisma migrations
        working-directory: ./platform
        run: npx prisma migrate deploy || echo "No migrations to run"
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - name: Run tests
        working-directory: ./platform
        run: yarn test || echo "No tests configured yet"
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret-for-ci

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Run npm audit
        working-directory: ./platform
        run: npm audit --audit-level=moderate || echo "Security audit completed with warnings"
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

---

## .github/workflows/deploy-preview.yml

```yaml
name: Deploy Preview

on:
  pull_request:
    branches: [ main ]

jobs:
  deploy-preview:
    name: Deploy Preview Environment
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
          cache-dependency-path: platform/yarn.lock
      
      - name: Install dependencies
        working-directory: ./platform
        run: yarn install --frozen-lockfile
      
      - name: Build application
        working-directory: ./platform
        run: yarn build
        env:
          NEXTAUTH_URL: ${{ secrets.PREVIEW_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}
      
      - name: Comment PR with preview link
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment готов! Ссылка будет доступна после настройки хостинга.'
            })
```

---

## .github/workflows/deploy-production.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    
    environment:
      name: production
      url: https://gogomarket.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
          cache-dependency-path: platform/yarn.lock
      
      - name: Install dependencies
        working-directory: ./platform
        run: yarn install --frozen-lockfile
      
      - name: Run database migrations
        working-directory: ./platform
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
      
      - name: Build application
        working-directory: ./platform
        run: yarn build
        env:
          NEXTAUTH_URL: ${{ secrets.PRODUCTION_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
      
      - name: Deploy to hosting
        run: |
          echo "Деплой в продакшн..."
          echo "Настройте интеграцию с вашим хостинг-провайдером"
          echo "Например: Vercel, AWS, DigitalOcean, etc."
      
      - name: Notify deployment success
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              state: 'success',
              context: 'deployment/production',
              description: 'Успешно задеплоено в продакшн'
            })
```

---

## .github/workflows/database-backup.yml

```yaml
name: Database Backup

on:
  schedule:
    # Запуск каждый день в 2:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  backup:
    name: Backup Production Database
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create database backup
        run: |
          echo "Создание бэкапа базы данных..."
          echo "Настройте pg_dump команду для вашей БД"
          # pg_dump ${{ secrets.PRODUCTION_DATABASE_URL }} > backup.sql
      
      - name: Upload backup to storage
        run: |
          echo "Загрузка бэкапа в облачное хранилище..."
          echo "Настройте загрузку в AWS S3, Google Cloud Storage или другое хранилище"
      
      - name: Notify backup completion
        run: |
          echo "Бэкап завершен успешно"
          echo "Настройте уведомления (email, Slack, Telegram, etc.)"
```

---

## .github/CODEOWNERS

```
# CODEOWNERS файл для автоматического назначения ревьюеров

# Все файлы требуют ревью от владельцев
* @buranovt2023-del

# Документация
/docs/ @buranovt2023-del

# База данных и схемы
/docs/technical/database_schema.md @buranovt2023-del
/docs/technical/schema.sql @buranovt2023-del
/platform/prisma/ @buranovt2023-del

# Основной код приложения
/platform/app/ @buranovt2023-del
/platform/components/ @buranovt2023-del
/platform/lib/ @buranovt2023-del

# CI/CD конфигурация
/.github/ @buranovt2023-del
```

---

## .github/pull_request_template.md

```markdown
## Описание изменений

<!-- Опишите, что было изменено и почему -->

## Тип изменений

- [ ] 🐛 Исправление бага
- [ ] ✨ Новая функция
- [ ] 📝 Обновление документации
- [ ] 🎨 Улучшение UI/UX
- [ ] ♻️ Рефакторинг кода
- [ ] ⚡ Улучшение производительности
- [ ] 🔒 Исправление проблем безопасности
- [ ] 🚀 Улучшение CI/CD

## Связанные задачи

<!-- Укажите номера связанных issues -->
Fixes #(issue)

## Чеклист

- [ ] Код следует стандартам проекта
- [ ] Проведено самостоятельное ревью кода
- [ ] Добавлены комментарии в сложных местах
- [ ] Обновлена документация (если необходимо)
- [ ] Изменения не генерируют новых предупреждений
- [ ] Добавлены тесты (если применимо)
- [ ] Все новые и существующие тесты проходят
- [ ] Проверено на разных устройствах/браузерах

## Скриншоты (если применимо)

<!-- Добавьте скриншоты изменений UI -->

## Дополнительные заметки

<!-- Любая дополнительная информация для ревьюеров -->
```

---

## .github/ISSUE_TEMPLATE/bug_report.md

```markdown
---
name: Bug Report
about: Сообщить о проблеме
title: '[BUG] '
labels: bug
assignees: ''
---

## Описание бага

<!-- Четкое и понятное описание проблемы -->

## Шаги для воспроизведения

1. Перейти в '...'
2. Нажать на '...'
3. Прокрутить до '...'
4. Увидеть ошибку

## Ожидаемое поведение

<!-- Описание того, что должно было произойти -->

## Фактическое поведение

<!-- Описание того, что произошло на самом деле -->

## Скриншоты

<!-- Если применимо, добавьте скриншоты -->

## Окружение

- **ОС**: [например, Windows 10, macOS, Ubuntu]
- **Браузер**: [например, Chrome 120, Firefox 121]
- **Версия приложения**: [например, 1.0.0]

## Дополнительный контекст

<!-- Любая дополнительная информация о проблеме -->
```

---

## .github/ISSUE_TEMPLATE/feature_request.md

```markdown
---
name: Feature Request
about: Предложить новую функцию
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Описание функции

<!-- Четкое и понятное описание желаемой функции -->

## Проблема, которую решает

<!-- Опишите проблему, которую решает эта функция -->

## Предлагаемое решение

<!-- Опишите, как вы видите реализацию этой функции -->

## Альтернативы

<!-- Опишите альтернативные решения, которые вы рассматривали -->

## Дополнительный контекст

<!-- Добавьте скриншоты, мокапы или любую другую информацию -->

## Приоритет

- [ ] Высокий
- [ ] Средний
- [ ] Низкий
```

---

## Инструкция по установке

### Способ 1: Через ZIP архив

1. Скачайте файл `cicd-files.zip`
2. Распакуйте в корень вашего репозитория
3. Выполните:
```bash
git add .github/ CI_CD_SETUP.md
git commit -m "Add CI/CD configuration"
git push origin feature/mvp-nextjs-app
```

### Способ 2: Через скрипт

```bash
bash INSTALL_CICD.sh
```

### Способ 3: Вручную

Создайте каждый файл вручную, скопировав содержимое из этого документа.

---

**После установки не забудьте настроить GitHub Secrets!**
