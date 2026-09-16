// SubagentStop-хук: исполнитель закончил или встал — снимает его запись из
// штаб/в-работе.json, закрывает штаб/права.json (охране файлов больше нечего
// разрешать этой роли) и печатает штабу то же системное сообщение, что раньше
// давал статический echo в settings.local.json.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..', '..');
const ФАЙЛ_ПРАВ = path.join(КОРЕНЬ, 'штаб', 'права.json');
const ФАЙЛ_РАБОТ = path.join(КОРЕНЬ, 'штаб', 'в-работе.json');

function читатьВход() {
  let текст = '';
  try { текст = fs.readFileSync(0, 'utf8'); } catch (о) { return null; }
  try { return JSON.parse(текст); } catch (о) { return null; }
}
function читатьJSON(файл, поУмолчанию) {
  try { return JSON.parse(fs.readFileSync(файл, 'utf8')); } catch (о) { return поУмолчанию; }
}

const данные = читатьВход();
const роль = данные && данные.agent_type ? String(данные.agent_type) : null;
const статус = данные && данные.status ? String(данные.status) : 'неизвестно';
const agentId = данные && данные.agent_id ? String(данные.agent_id) : '?';

if (роль) {
  const права = читатьJSON(ФАЙЛ_ПРАВ, {});
  delete права[роль];
  try { fs.writeFileSync(ФАЙЛ_ПРАВ, JSON.stringify(права, null, 2) + '\n', 'utf8'); } catch (о) { console.error('охрана: не удалось обновить права.json: ' + о.message); }

  const работы = читатьJSON(ФАЙЛ_РАБОТ, { работы: [] });
  if (!Array.isArray(работы.работы)) работы.работы = [];
  работы.работы = работы.работы.filter((р) => р.кто !== роль);
  try { fs.writeFileSync(ФАЙЛ_РАБОТ, JSON.stringify(работы, null, 2) + '\n', 'utf8'); } catch (о) { console.error('в-работе: не удалось обновить в-работе.json: ' + о.message); }

  try { execFileSync('node', [path.join(КОРЕНЬ, 'штаб', 'в-работе.js'), '--всё-равно'], { stdio: 'ignore' }); } catch (о) { /* ЗАДАЧИ.md пересоберёт следующий вызов */ }
}

const сообщение = роль
  ? '[ШТАБУ] Исполнитель «' + роль + '» закончил работу или был остановлен (agent_id ' + agentId + ', статус ' + статус + '). Проверить: пришёл ли отчёт, появились ли файлы. Молчание прогрессом не считать.'
  : '[ШТАБУ] Исполнитель закончил работу или был остановлен, роль не распозналась по входу хука. Проверить вручную: пришёл ли отчёт, появились ли файлы.';

console.log(JSON.stringify({ systemMessage: сообщение }));
process.exit(0);
