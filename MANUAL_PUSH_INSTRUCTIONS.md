# Инструкции по ручной загрузке CI/CD файлов

## Проблема
GitHub App не имеет разрешения на создание workflow файлов (это мера безопасности GitHub).

## Решение

### Вариант 1: Дать разрешение GitHub App (Рекомендуется)

1. Перейдите: https://github.com/apps/abacusai/installations/select_target
2. Выберите ваш аккаунт/организацию
3. В разделе "Repository access" найдите репозиторий `gogomarket`
4. В разделе "Permissions" найдите "Workflows" и установите "Read and write"
5. Сохраните изменения
6. После этого я смогу загрузить файлы автоматически

### Вариант 2: Загрузить файлы вручную

1. Все CI/CD файлы уже созданы локально в `/home/ubuntu/github_repos/gogomarket`

2. Скачайте файлы через File Manager или используйте git на вашем локальном компьютере:

```bash
# Клонируйте репозиторий на ваш компьютер
git clone https://github.com/buranovt2023-del/gogomarket.git
cd gogomarket

# Переключитесь на ветку
git checkout feature/mvp-nextjs-app

# Скопируйте файлы CI/CD из этого проекта
# или создайте их заново, используя содержимое ниже

# Закоммитьте и отправьте
git add .github/ CI_CD_SETUP.md
git commit -m "Add CI/CD pipeline configuration"
git push origin feature/mvp-nextjs-app
```

3. Или создайте файлы напрямую через GitHub интерфейс:
   - Перейдите: https://github.com/buranovt2023-del/gogomarket/tree/feature/mvp-nextjs-app
   - Нажмите "Add file" → "Create new file"
   - Создайте файл `.github/workflows/ci.yml`
   - Скопируйте содержимое из локального файла
   - Повторите для остальных файлов

## Созданные файлы

Следующие файлы были созданы локально и готовы к загрузке:

- `.github/workflows/ci.yml` - Основной CI pipeline
- `.github/workflows/deploy-preview.yml` - Preview деплойменты
- `.github/workflows/deploy-production.yml` - Production деплой
- `.github/workflows/database-backup.yml` - Бэкапы БД
- `.github/CODEOWNERS` - Автоназначение ревьюеров
- `.github/pull_request_template.md` - Шаблон PR
- `.github/ISSUE_TEMPLATE/bug_report.md` - Шаблон для багов
- `.github/ISSUE_TEMPLATE/feature_request.md` - Шаблон для фич
- `CI_CD_SETUP.md` - Документация по настройке

## После загрузки

После того как файлы будут загружены на GitHub:

1. GitHub Actions автоматически начнет работать
2. При каждом push будет запускаться CI pipeline
3. При создании PR будет создаваться preview
4. При мерже в main будет автоматический деплой

## Нужна помощь?

Если возникли сложности, дайте знать!
