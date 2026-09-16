// Разбор логов сессий Claude Code для аудита системы «штаб + исполнители».
// Только чтение. Ничего не пишет на диск — печатает сводку в консоль.
//
// Запуск:
//   node штаб/аудит-логи.js            — окно 7 дней
//   node штаб/аудит-логи.js 3          — окно 3 дня
//   node штаб/аудит-логи.js 7 4        — окно 7 дней, но считать только то,
//                                        что старше 4 дней (для «до/после»)
//
// Логи лежат в C:\Users\Admin\.claude\projects\d--Claud-Games:
//   <id>.jsonl                     — сессия главного окна (штаб)
//   <id>/subagents/agent-*.jsonl   — сессии исполнителей (субагентов)
// Файлы большие (до 100 МБ), поэтому читаем построчно потоком.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const КОРЕНЬ = 'C:/Users/Admin/.claude/projects/d--Claud-Games';
const ДНЕЙ = Number(process.argv[2] || 7);
const СТАРШЕ_ДНЕЙ = Number(process.argv[3] || 0); // 0 = без верхней границы
const сейчас = Date.now();
const ОТ = сейчас - ДНЕЙ * 86400000;
const ДО = СТАРШЕ_ДНЕЙ ? сейчас - СТАРШЕ_ДНЕЙ * 86400000 : сейчас + 1;

const БРАУЗЕР = /^mcp__playwright__/;

// ---- сбор файлов ------------------------------------------------------------
function файлы(папка, итог) {
  for (const э of fs.readdirSync(папка, { withFileTypes: true })) {
    const п = path.join(папка, э.name);
    if (э.isDirectory()) файлы(п, итог);
    else if (э.name.endsWith('.jsonl')) итог.push(п);
  }
  return итог;
}

const всеФайлы = файлы(КОРЕНЬ, []).filter((ф) => fs.statSync(ф).mtimeMs >= ОТ);

// ---- разбор одного файла ----------------------------------------------------
function пустая(имя, файл) {
  return {
    имя, файл,
    исполнитель: файл.includes(path.sep + 'subagents' + path.sep),
    запросов: 0, максКонтекст: 0, запросовБольше300k: 0,
    модели: {}, инструменты: {}, картинок: 0,
    первый: null, последний: null, паузыЧас: 0, метки: [],
    вызовыAgent: [], параллельныхПачек: 0, ботПачки: 0,
    вРаботеJs: {}, bashКоманд: 0,
  };
}

function разобрать(файл) {
  return new Promise((готово) => {
    const с = пустая(path.basename(файл, '.jsonl'), файл);
    const видел = new Set();
    const rl = readline.createInterface({ input: fs.createReadStream(файл, 'utf8'), crlfDelay: Infinity });
    rl.on('line', (строка) => {
      if (!строка) return;
      // быстрый отсев: интересны только строки с usage, tool_use, image, agentId
      let о;
      try { о = JSON.parse(строка); } catch (е) { return; }
      const t = о.timestamp ? new Date(о.timestamp).getTime() : 0;
      if (!t || t < ОТ || t > ДО) return;

      if (о.type === 'assistant' && о.message) {
        const у = о.message.usage;
        const ключ = о.requestId || о.message.id;
        if (у && ключ && !видел.has(ключ)) {
          видел.add(ключ);
          const контекст = (у.input_tokens || 0) + (у.cache_creation_input_tokens || 0) + (у.cache_read_input_tokens || 0);
          с.запросов++;
          if (контекст > с.максКонтекст) с.максКонтекст = контекст;
          if (контекст > 300000) с.запросовБольше300k++;
          const м = (о.message.model || '?').replace('claude-', '');
          с.модели[м] = (с.модели[м] || 0) + 1;
          с.метки.push(t);
        }
        const c = о.message.content;
        if (Array.isArray(c)) {
          let агентовВСообщении = 0;
          for (const б of c) {
            if (б.type !== 'tool_use') continue;
            const имя = б.name || '?';
            с.инструменты[имя] = (с.инструменты[имя] || 0) + 1;
            if (имя === 'Agent' || имя === 'Task') {
              агентовВСообщении++;
              с.вызовыAgent.push({
                id: б.id,
                роль: (б.input && (б.input.subagent_type || б.input.subagentType)) || '?',
                имя: (б.input && б.input.name) || '',
                модель: (б.input && б.input.model) || '',
                описание: (б.input && б.input.description) || '',
                когда: о.timestamp,
              });
            }
            if (имя === 'Bash' || имя === 'PowerShell') {
              с.bashКоманд++;
              const к = (б.input && б.input.command) || '';
              if (к.includes('в-работе.js')) {
                const д = о.timestamp.slice(0, 10);
                с.вРаботеJs[д] = (с.вРаботеJs[д] || 0) + 1;
              }
            }
          }
          if (агентовВСообщении > 1) { с.параллельныхПачек++; с.ботПачки += агентовВСообщении; }
        }
      }

      // картинки приходят в результатах инструментов (user/attachment)
      if (о.type === 'user' || о.type === 'attachment') {
        const c = о.message && о.message.content;
        if (Array.isArray(c)) {
          for (const б of c) {
            if (б.type === 'image') с.картинок++;
            if (б.type === 'tool_result' && Array.isArray(б.content)) {
              for (const вб of б.content) if (вб.type === 'image') с.картинок++;
            }
            // связь вызова Agent с файлом исполнителя
            if (б.type === 'tool_result') {
              const текст = typeof б.content === 'string' ? б.content
                : Array.isArray(б.content) ? б.content.map((x) => x.text || '').join(' ') : '';
              const м = текст.match(/agentId:\s*([0-9a-f]+)/);
              if (м) связь[б.tool_use_id] = м[1];
            }
          }
        }
      }
    });
    rl.on('close', () => {
      if (с.метки.length) {
        с.метки.sort((а, б) => а - б);
        с.первый = с.метки[0];
        с.последний = с.метки[с.метки.length - 1];
        for (let i = 1; i < с.метки.length; i++) if (с.метки[i] - с.метки[i - 1] > 3600000) с.паузыЧас++;
      }
      delete с.метки;
      готово(с);
    });
  });
}

const связь = {}; // tool_use_id -> agentId

// ---- печать -----------------------------------------------------------------
const М = (ч) => (ч / 1000).toFixed(0) + 'k';
const час = (мс) => (мс / 3600000).toFixed(1) + ' ч';
const дата = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ');

(async () => {
  const сессии = [];
  for (const ф of всеФайлы) сессии.push(await разобрать(ф));

  // роль исполнителя: по вызову Agent из главной сессии
  const рольПоАгенту = {};
  const модельПоАгенту = {};
  const имяПоАгенту = {};
  for (const с of сессии) {
    for (const в of с.вызовыAgent) {
      const aid = связь[в.id];
      if (aid) { рольПоАгенту[aid] = в.роль; модельПоАгенту[aid] = в.модель; имяПоАгенту[aid] = в.имя; }
    }
  }
  const роль = (с) => {
    if (!с.исполнитель) return 'ШТАБ';
    const aid = с.имя.replace(/^agent-/, '');
    return рольПоАгенту[aid] || '?';
  };

  console.log('=== окно: с ' + new Date(ОТ).toISOString().slice(0, 16) + (СТАРШЕ_ДНЕЙ ? ' по ' + new Date(ДО).toISOString().slice(0, 16) : ' по сейчас'));
  console.log('=== файлов логов в окне: ' + всеФайлы.length);

  console.log('\n--- СЕССИИ ШТАБА (главное окно) ---');
  let штабЗапросов = 0, штаб300k = 0, штабКартинок = 0, штабПачек = 0;
  for (const с of сессии.filter((x) => !x.исполнитель && x.запросов)) {
    штабЗапросов += с.запросов; штаб300k += с.запросовБольше300k; штабКартинок += с.картинок; штабПачек += с.параллельныхПачек;
    console.log([
      с.имя.slice(0, 8),
      'запросов ' + с.запросов,
      'контекст до ' + М(с.максКонтекст),
      '>300k: ' + с.запросовБольше300k + ' (' + (100 * с.запросовБольше300k / с.запросов).toFixed(0) + '%)',
      'модели ' + Object.entries(с.модели).map(([м, н]) => м + ':' + н).join(','),
      дата(с.первый) + ' → ' + дата(с.последний) + ' (' + час(с.последний - с.первый) + ')',
      'пауз>1ч: ' + с.паузыЧас,
      'картинок ' + с.картинок,
      'Agent-вызовов ' + с.вызовыAgent.length,
      'пачек>1 Agent в сообщении: ' + с.параллельныхПачек,
    ].join(' | '));
    const и = Object.entries(с.инструменты).sort((а, б) => б[1] - а[1]);
    console.log('    инструменты: ' + и.map(([н, к]) => н + ' ' + к).join(', '));
    const вр = Object.entries(с.вРаботеJs).sort();
    if (вр.length) console.log('    в-работе.js по дням: ' + вр.map(([д, к]) => д + ':' + к).join(' '));
  }
  console.log('ИТОГО штаб: запросов ' + штабЗапросов + ', из них при контексте >300k — ' + штаб300k
    + ' (' + (штабЗапросов ? (100 * штаб300k / штабЗапросов).toFixed(0) : 0) + '%), картинок в контексте ' + штабКартинок
    + ', сообщений с >1 Agent: ' + штабПачек);

  console.log('\n--- ИСПОЛНИТЕЛИ по ролям ---');
  const поРолям = {};
  for (const с of сессии.filter((x) => x.исполнитель && x.запросов)) {
    const р = роль(с);
    const п = поРолям[р] || (поРолям[р] = { сессий: 0, запросов: 0, макс: 0, инстр: {}, картинок: 0, модели: {}, длит: 0 });
    п.сессий++; п.запросов += с.запросов; п.макс = Math.max(п.макс, с.максКонтекст); п.картинок += с.картинок;
    п.длит += (с.последний - с.первый);
    for (const [н, к] of Object.entries(с.инструменты)) п.инстр[н] = (п.инстр[н] || 0) + к;
    for (const [м, к] of Object.entries(с.модели)) п.модели[м] = (п.модели[м] || 0) + к;
  }
  for (const [р, п] of Object.entries(поРолям).sort((а, б) => б[1].запросов - а[1].запросов)) {
    const всего = Object.values(п.инстр).reduce((s, x) => s + x, 0);
    const бр = Object.entries(п.инстр).filter(([н]) => БРАУЗЕР.test(н)).reduce((s, x) => s + x[1], 0);
    console.log([
      р.padEnd(12),
      'сессий ' + п.сессий,
      'запросов ' + п.запросов,
      'контекст до ' + М(п.макс),
      'модели ' + Object.entries(п.модели).map(([м, н]) => м + ':' + н).join(','),
      'инстр ' + всего,
      'браузер ' + бр + ' (' + (всего ? (100 * бр / всего).toFixed(0) : 0) + '%)',
      'картинок ' + п.картинок,
      'суммарно ' + час(п.длит),
    ].join(' | '));
    const и = Object.entries(п.инстр).sort((а, б) => б[1] - а[1]).slice(0, 12);
    console.log('    ' + и.map(([н, к]) => н + ' ' + к).join(', '));
  }

  console.log('\n--- ЗАПУСКИ ИСПОЛНИТЕЛЕЙ (вызовы Agent из штаба) ---');
  const счётРолей = {};
  const поДням = {};
  for (const с of сессии.filter((x) => !x.исполнитель)) {
    for (const в of с.вызовыAgent) {
      счётРолей[в.роль] = (счётРолей[в.роль] || 0) + 1;
      const д = в.когда.slice(0, 10);
      (поДням[д] = поДням[д] || {})[в.роль] = ((поДням[д] || {})[в.роль] || 0) + 1;
    }
  }
  console.log('всего по ролям: ' + Object.entries(счётРолей).sort((а, б) => б[1] - а[1]).map(([р, к]) => р + ' ' + к).join(', '));
  for (const [д, м] of Object.entries(поДням).sort()) {
    console.log('  ' + д + ': ' + Object.entries(м).map(([р, к]) => р + ' ' + к).join(', '));
  }

  console.log('\n--- ЗАГОЛОВКИ ЗАДАНИЙ (description) ---');
  for (const с of сессии.filter((x) => !x.исполнитель)) {
    for (const в of с.вызовыAgent) {
      console.log('  ' + в.когда.slice(5, 16) + ' ' + в.роль.padEnd(11) + ' ' + (в.модель || '-').padEnd(7) + ' ' + (в.имя || '-').padEnd(24) + ' ' + в.описание);
    }
  }
})();
