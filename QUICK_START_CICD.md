# 🚀 Быстрый старт: Установка CI/CD

## 📦 Что готово

✅ **Все CI/CD файлы созданы и упакованы**  
✅ **Загружено на GitHub** в ветку `feature/mvp-nextjs-app`  
✅ **Готово к установке** на вашем локальном компьютере  

## 🎯 Самый простой способ (3 минуты)

### Шаг 1: Клонируйте репозиторий

```bash
git clone https://github.com/buranovt2023-del/gogomarket.git
cd gogomarket
git checkout feature/mvp-nextjs-app
```

### Шаг 2: Установите CI/CD

**Вариант A - Автоматический скрипт:**
```bash
bash INSTALL_CICD.sh
```

**Вариант B - Вручную:**
```bash
unzip cicd-files.zip
git add .github/
git commit -m "Add CI/CD workflows"
git push origin feature/mvp-nextjs-app
```

### Шаг 3: Готово! 🎉

CI/CD теперь работает на GitHub!

## 📋 Что установится

- ✅ **ci.yml** - Автоматическое тестирование при каждом push
- ✅ **deploy-preview.yml** - Preview для Pull Requests
- ✅ **deploy-production.yml** - Деплой в продакшн
- ✅ **database-backup.yml** - Ежедневные бэкапы
- ✅ **CODEOWNERS** - Автоназначение ревьюеров
- ✅ **PR Templates** - Шаблоны для Pull Requests
- ✅ **Issue Templates** - Шаблоны для багов и фич

## 🔧 Следующий шаг - Настройка секретов

После установки нужно добавить секреты в GitHub:

1. Перейдите: https://github.com/buranovt2023-del/gogomarket/settings/secrets/actions

2. Добавьте следующие секреты:

**Для Preview окружения:**
- `PREVIEW_URL` = ваш preview URL
- `PREVIEW_DATABASE_URL` = URL preview БД  
- `NEXTAUTH_SECRET` = секретный ключ

**Для Production:**
- `PRODUCTION_URL` = https://gogomarket.com
- `PRODUCTION_DATABASE_URL` = URL продакшн БД
- `NEXTAUTH_SECRET` = секретный ключ

## 🎬 Как это работает

После установки:

1. **При каждом push** в любую feature/* ветку:
   - ✅ Проверяется код (lint, types)
   - ✅ Собирается приложение
   - ✅ Запускаются тесты
   - ✅ Сканируется безопасность

2. **При создании Pull Request:**
   - ✅ Все то же что и выше
   - ✅ Создается preview окружение
   - ✅ Добавляется комментарий с ссылкой

3. **При мерже в main:**
   - ✅ Автоматический деплой в продакшн
   - ✅ Миграции базы данных
   - ✅ Уведомления о статусе

4. **Каждый день в 2:00 UTC:**
   - ✅ Создается бэкап БД
   - ✅ Загружается в облако

## 📁 Где найти файлы

Все файлы находятся в корне репозитория:

- `cicd-files.zip` - Архив со всеми файлами
- `INSTALL_CICD.sh` - Скрипт автоустановки
- `CICD_FILES_CONTENT.md` - Полное содержимое всех файлов
- `CI_CD_SETUP.md` - Подробная документация

## 🆘 Нужна помощь?

**Проблема с установкой?**  
Смотрите файл `MANUAL_PUSH_INSTRUCTIONS.md`

**Нужно полное содержимое файлов?**  
Смотрите файл `CICD_FILES_CONTENT.md`

**Вопросы по настройке?**  
Смотрите файл `CI_CD_SETUP.md`

## ✅ Чеклист установки

- [ ] Клонировал репозиторий
- [ ] Запустил `INSTALL_CICD.sh` или распаковал ZIP
- [ ] Закоммитил изменения
- [ ] Отправил на GitHub
- [ ] Добавил секреты в GitHub
- [ ] Проверил что CI запускается
- [ ] Настроил хостинг для деплоя

---

**Все готово! CI/CD работает! 🚀**
