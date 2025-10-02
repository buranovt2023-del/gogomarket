
module.exports = async (ctx) => {
  const helpText = `
🤖 *GOGOMARKET DevOps Bot*

*Мониторинг:*
/status - Общий статус всех систем
/health - Health check сервисов
/report - Отчет за 24 часа
/errors - Последние ошибки

*Тестирование:*
/test\\_all - Запустить все E2E тесты
/test\\_critical - Критичные тесты
/test [function] - Проверить функцию

*Деплой:*
/deploy [branch] - Деплой с тестами
/rollback - Откатить версию
/rollback [commit] - Откат на коммит
/maintenance on/off - Режим обслуживания

*GitHub:*
/commits - Последние коммиты
/branches - Список веток
/compare - Сравнить версии
/ci\\_status - Статус CI/CD

*Автоматика:*
✅ E2E тесты каждые 4 часа
✅ Автоматический откат при критических ошибках
✅ Уведомления об ошибках
✅ Мониторинг производительности

_Версия 1.0.0 | GOGOMARKET DevOps Team_
  `;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
};
