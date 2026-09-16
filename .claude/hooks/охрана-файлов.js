// PreToolUse-хук (matcher "Edit|Write|MultiEdit"): держит «один файл — один
// исполнитель» не только текстом правил, а кодом. Источник правды —
// штаб/права.json, который заводит .claude/hooks/начало-исполнителя.js.
//
// Своя правка штаба (главная сессия) идёт без agent_type во входе хука —
// такой вызов не трогаем, пропускаем всегда (штабу видно и так, что он делает).
// Пустой или отсутствующий права.json — не блокируем всех подряд (это была бы
// ошибка хуже дыры в правах), а предупреждаем и пропускаем.
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..', '..');
const ФАЙЛ_ПРАВ = path.join(КОРЕНЬ, 'штаб', 'права.json');

function читатьВход() {
  let текст = '';
  try { текст = fs.readFileSync(0, 'utf8'); } catch (о) { return null; }
  try { return JSON.parse(текст); } catch (о) { return null; }
}

function нормализовать(п) {
  if (!п) return '';
  let полный = path.isAbsolute(п) ? п : path.join(КОРЕНЬ, п);
  return path.relative(КОРЕНЬ, полный).split(path.sep).join('/').toLowerCase();
}

/** Запись из «Файлы:» может быть точным путём или маской со звёздочкой. */
function подходит(маска, путь) {
  const м = нормализовать(маска);
  if (!м) return false;
  if (!м.includes('*')) return м === путь;
  const кусочки = м.split('*').map((к) => к.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  const рег = new RegExp('^' + кусочки.join('.*') + '$');
  return рег.test(путь);
}

const данные = читатьВход();
if (!данные) process.exit(0); // мусор на входе — не рушим хук, пропускаем

// Своя правка штаба: agent_type у главной сессии не бывает.
if (!данные.agent_type) process.exit(0);

const роль = String(данные.agent_type);
const вход = данные.tool_input || {};
const файлПравки = вход.file_path || (Array.isArray(вход.edits) && вход.edits[0] && вход.edits[0].file_path) || '';
if (!файлПравки) process.exit(0); // нечего проверять — не тот инструмент

let права;
try {
  права = JSON.parse(fs.readFileSync(ФАЙЛ_ПРАВ, 'utf8'));
} catch (о) {
  console.error('охрана-файлов: штаб/права.json нет или не читается — пропускаю без проверки (' + о.message + ')');
  process.exit(0);
}

if (!права || typeof права !== 'object' || Object.keys(права).length === 0) {
  console.error('охрана-файлов: штаб/права.json пуст — пропускаю без проверки, это не повод блокировать всех');
  process.exit(0);
}

const запись = права[роль];
if (!запись || !Array.isArray(запись.файлы) || запись.файлы.length === 0) {
  console.error('охрана-файлов: для роли «' + роль + '» в правах нет списка файлов — пропускаю без проверки');
  process.exit(0);
}

const путь = нормализовать(файлПравки);
const разрешено = запись.файлы.some((маска) => подходит(маска, путь));

if (!разрешено) {
  console.error(
    'охрана-файлов: исполнителю «' + роль + '» не разрешён файл «' + файлПравки + '» ' +
    '(в задании были: ' + запись.файлы.join(', ') + '). ' +
    'Один файл — один исполнитель: если файл правда нужен, остановись и спроси штаб.'
  );
  process.exit(2);
}

process.exit(0);
