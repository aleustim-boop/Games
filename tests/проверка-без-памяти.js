'use strict';

/* Живая проверка флага --без-памяти: сервер поднимается отдельным
   процессом, как его поднимает тестировщик, в нём создаётся комната,
   и через 7 секунд (запись отложена на 5) смотрим, появился ли файл
   статистики. Потом то же самое без флага — файл обязан появиться,
   и мы его убираем. */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const КОРЕНЬ = require('path').resolve(__dirname, '..');   // корень проекта — от этого файла, а не зашитый
const ФАЙЛ = path.join(КОРЕНЬ, 'server/данные/статистика.json');
const ПОРТ = 8799;
const спать = function (мс) { return new Promise(function (f) { setTimeout(f, мс); }); };

let всёХорошо = true;
function проверить(что, правда) {
  console.log((правда ? '  ок   ' : '  БЕДА ') + что);
  if (!правда) всёХорошо = false;
}

function поднять(доводы) {
  return new Promise(function (готово) {
    const дитя = spawn('node', [path.join(КОРЕНЬ, 'server/сервер.js')].concat(доводы));
    let вывод = '';
    дитя.stdout.on('data', function (к) {
      вывод += к;
      if (/работает на порту/.test(вывод)) готово({ дитя: дитя, вывод: вывод });
    });
  });
}

async function прогон(доводы, ждёмФайл) {
  if (fs.existsSync(ФАЙЛ)) fs.unlinkSync(ФАЙЛ);
  const { дитя, вывод } = await поднять(доводы);
  console.log('  запуск «' + доводы.join(' ') + '»: ' + (вывод.split('\n')[0] || ''));
  const ответ = await fetch('http://127.0.0.1:' + ПОРТ + '/создать', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  }).then(function (о) { return о.json(); });
  проверить('комната создана', Boolean(ответ.код));
  await спать(7000);
  const есть = fs.existsSync(ФАЙЛ);
  проверить(ждёмФайл ? 'файл статистики появился (обычный запуск)' : 'файла статистики НЕТ (запуск без памяти)',
    есть === ждёмФайл);
  дитя.kill();
  await спать(500);
  if (fs.existsSync(ФАЙЛ)) fs.unlinkSync(ФАЙЛ);
}

(async function () {
  await прогон([String(ПОРТ), '--без-памяти'], false);
  await прогон([String(ПОРТ)], true);
  console.log(всёХорошо ? 'ИТОГ: всё сошлось.' : 'ИТОГ: есть беды.');
  process.exit(всёХорошо ? 0 : 1);
})();
