// Подсчёт расхода лимита по записям сессий Claude Code с начала недели.
// Идёт по всем .jsonl в ~/.claude/projects, берёт usage у каждого запроса
// (один запрос пишется несколькими строками — считаем его один раз),
// складывает по проекту и исполнителю. «Вес» — грубая мера цены:
// ввод 1, запись в кэш 1.25, чтение кэша 0.1, вывод 5 (соотношение цен).
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = 'C:/Users/Admin/.claude/projects';
const С = process.argv[2] || '2026-09-09T00:00:00';
const с = new Date(С).getTime();

function файлы(папка, итог) {
  for (const имя of fs.readdirSync(папка, { withFileTypes: true })) {
    const п = path.join(папка, имя.name);
    if (имя.isDirectory()) файлы(п, итог);
    else if (имя.name.endsWith('.jsonl') && fs.statSync(п).mtimeMs >= с) итог.push(п);
  }
  return итог;
}

const видел = new Set();
const группы = {};
const поДням = {};
for (const ф of файлы(КОРЕНЬ, [])) {
  const проект = path.relative(КОРЕНЬ, ф).split(path.sep)[0];
  const исп = ф.includes(path.sep + 'subagents' + path.sep);
  for (const строка of fs.readFileSync(ф, 'utf8').split('\n')) {
    if (!строка.includes('"usage"')) continue;
    let з; try { з = JSON.parse(строка); } catch (о) { continue; }
    const у = з.message && з.message.usage; if (!у) continue;
    const когда = new Date(з.timestamp).getTime(); if (!(когда >= с)) continue;
    const ключ = з.requestId || (з.message && з.message.id) || строка.slice(0, 80);
    if (видел.has(ключ)) continue; видел.add(ключ);
    const кто = исп ? (з.attributionAgent || 'исполнитель') : 'главная';
    const модель = (з.message.model || '?').replace('claude-', '');
    const г = проект + ' | ' + кто + ' | ' + модель;
    const р = группы[г] || (группы[г] = { запросов: 0, ввод: 0, запись: 0, кэш: 0, вывод: 0, макс: 0 });
    const контекст = (у.input_tokens || 0) + (у.cache_creation_input_tokens || 0) + (у.cache_read_input_tokens || 0);
    р.запросов++; р.ввод += у.input_tokens || 0; р.запись += у.cache_creation_input_tokens || 0;
    р.кэш += у.cache_read_input_tokens || 0; р.вывод += у.output_tokens || 0; р.макс = Math.max(р.макс, контекст);
    const день = з.timestamp.slice(0, 10);
    поДням[день] = (поДням[день] || 0) + вес(у);
  }
}
function вес(у) {
  return (у.input_tokens || 0) + 1.25 * (у.cache_creation_input_tokens || 0) + 0.1 * (у.cache_read_input_tokens || 0) + 5 * (у.output_tokens || 0);
}
const строки = Object.entries(группы).map(function ([г, р]) {
  return { г: г, р: р, в: р.ввод + 1.25 * р.запись + 0.1 * р.кэш + 5 * р.вывод };
}).sort(function (а, б) { return б.в - а.в; });
const всего = строки.reduce(function (s, x) { return s + x.в; }, 0);
const М = function (ч) { return (ч / 1e6).toFixed(1) + 'M'; };
console.log('с ' + С + ', всего веса ' + М(всего));
for (const x of строки.slice(0, 25)) {
  console.log((100 * x.в / всего).toFixed(1).padStart(5) + '%  ' + x.г + '  запросов ' + x.р.запросов
    + '  кэш ' + М(x.р.кэш) + '  запись ' + М(x.р.запись) + '  вывод ' + М(x.р.вывод) + '  контекст до ' + Math.round(x.р.макс / 1000) + 'k');
}
console.log('по дням: ' + Object.entries(поДням).sort().map(function ([д, в]) { return д + ' ' + (100 * в / всего).toFixed(0) + '%'; }).join(' · '));
