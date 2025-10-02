
#!/bin/bash

# Скрипт для установки CI/CD конфигурации в репозиторий GOGOMARKET
# Использование: bash INSTALL_CICD.sh

set -e

echo "🚀 Установка CI/CD конфигурации для GOGOMARKET..."

# Проверка что мы в репозитории
if [ ! -d ".git" ]; then
    echo "❌ Ошибка: Этот скрипт должен быть запущен из корня git репозитория"
    exit 1
fi

# Проверка что мы на правильной ветке
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feature/mvp-nextjs-app" ]; then
    echo "⚠️  Вы находитесь на ветке $CURRENT_BRANCH"
    echo "Рекомендуется переключиться на feature/mvp-nextjs-app"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Создание директорий
echo "📁 Создание директорий..."
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

# Копирование файлов из ZIP архива или из текущей директории
if [ -f "cicd-files.zip" ]; then
    echo "📦 Распаковка файлов из архива..."
    unzip -o cicd-files.zip
else
    echo "⚠️  Файл cicd-files.zip не найден"
    echo "Скопируйте файлы вручную или скачайте архив"
    exit 1
fi

# Добавление в git
echo "📝 Добавление файлов в git..."
git add .github/ CI_CD_SETUP.md

# Показываем статус
echo ""
echo "✅ Файлы готовы к коммиту!"
echo ""
git status

echo ""
echo "Следующие шаги:"
echo "1. Проверьте изменения: git status"
echo "2. Закоммитьте: git commit -m 'Add CI/CD pipeline'"
echo "3. Отправьте на GitHub: git push origin feature/mvp-nextjs-app"
echo ""
echo "⚠️  ВАЖНО: Если push не удается из-за permissions:"
echo "Дайте workflow права GitHub App по ссылке:"
echo "https://github.com/apps/abacusai/installations/select_target"
