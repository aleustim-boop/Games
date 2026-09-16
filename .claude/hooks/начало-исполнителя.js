// PostToolUse-хук (matcher "Agent"): исполнитель запущен — отмечает «начал»
// в штаб/в-работе.json и заводит запись в штаб/права.json (роль → файлы
// из строки «Файлы:» задания, время начала). Права.json — источник правды
// для .claude/hooks/охрана-файлов.js.
//
// Ключ записи — роль (tool_input.subagent_type), а не agent_id: документация
// code.claude.com не описывает поле с id субагента в tool_response вызова
// Agent из главной сессии (см. штаб/письмо-об-аудите-2.md, пункт 4). Роль как
// ключ безопасна ровно потому, что в правилах команды один файл — один
// исполнитель и роли не запускаются пачками параллельно; если это когда-то
// перестанет быть так, вторая запись той же роли молча перепишет первую.
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
function времяЗаписью(дата) {
  const дв = (ч) => String(ч).padStart(2, '0');
  return дата.getFullYear() + '-' + дв(дата.getMonth() + 1) + '-' + дв(дата.getDate())
    + ' ' + дв(дата.getHours()) + ':' + дв(дата.getMinutes());
}

const данные = читатьВход();
if (!данные || данные.tool_name !== 'Agent') process.exit(0);

const вход = данные.tool_input || {};
const роль = String(вход.subagent_type || '').trim();
if (!роль) process.exit(0);

const описание = String(вход.description || роль);
const задание = String(вход.prompt || '');
const строкаФайлов = /Файлы:\s*(.+)/.exec(задание);
const файлы = строкаФайлов
  ? строкаФайлов[1].split(/[,;]/).map((с) => с.trim()).filter(Boolean)
  : [];

const сейчас = времяЗаписью(new Date());

const права = читатьJSON(ФАЙЛ_ПРАВ, {});
права[роль] = { имя: роль, роль: роль, файлы: файлы, начал: сейчас };
try { fs.writeFileSync(ФАЙЛ_ПРАВ, JSON.stringify(права, null, 2) + '\n', 'utf8'); } catch (о) { console.error('охрана: не удалось записать права.json: ' + о.message); }

const работы = читатьJSON(ФАЙЛ_РАБОТ, { работы: [] });
if (!Array.isArray(работы.работы)) работы.работы = [];
работы.работы = работы.работы.filter((р) => р.кто !== роль);
работы.работы.push({ что: описание, важность: 'скоро', кто: роль, начато: сейчас });
try { fs.writeFileSync(ФАЙЛ_РАБОТ, JSON.stringify(работы, null, 2) + '\n', 'utf8'); } catch (о) { console.error('в-работе: не удалось записать в-работе.json: ' + о.message); }

try { execFileSync('node', [path.join(КОРЕНЬ, 'штаб', 'в-работе.js'), '--всё-равно'], { stdio: 'ignore' }); } catch (о) { /* ЗАДАЧИ.md пересоберёт следующий вызов */ }

process.exit(0);
