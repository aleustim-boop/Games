'use strict';

/* Проверка: ссылка «Похвастаться» у каждой сетевой игры ведёт в ЭТУ игру,
   а не в дурака. Для каждой игры из сетевыеИгры() сервера (кроме дурака,
   у которого метки в ссылке нет нарочно) ссылка, что строит браузер,
   обязана содержать ?startapp=<метка из меткаИгры сервера>.
   Браузерный js/похвастаться.js запускаем в песочнице vm с поддельным
   Telegram на телефоне: тогда слова уходят в список чатов ссылкой t.me/share,
   а ссылка на игру лежит в её параметре url.

   Запуск:  node tests/похвастаться-метки.js [путь-к-файлу]
   (путь по умолчанию — js/похвастаться.js)
   Ломающий запуск: передать путь к копии файла без записи «домино» —
   проверка обязана покраснеть. Настоящий файл не портим. */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const КОРЕНЬ = path.resolve(__dirname, '..');
const названия = require(path.join(КОРЕНЬ, 'server', 'названия.js'));
const аргумент = process.argv.slice(2).find(function (а) { return !а.startsWith('--'); });
const ПУТЬ_ФАЙЛА = аргумент ? path.resolve(аргумент) : path.join(КОРЕНЬ, 'js', 'похвастаться.js');

let всего = 0;
let провалов = 0;
function проверить(что, правда) {
  всего++;
  if (!правда) провалов++;
  console.log((правда ? '  ок   ' : '  БЕДА ') + что);
}

/** Ссылка на игру, которую браузер положил бы в чат; пусто — не вышло. */
async function ссылкаБраузера(исходник, игра) {
  const отправленное = { адрес: '' };
  const окно = {
    location: { search: '', hash: '', protocol: 'https:', href: 'https://пример/Games/',
                origin: 'https://пример', pathname: '/Games/', host: 'пример' },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    navigator: {},
    Telegram: { WebApp: {
      initData: 'проверка', platform: 'android',
      openTelegramLink: function (адрес) { отправленное.адрес = адрес; }
    } }
  };
  const окружение = {
    window: окно, document: { getElementById: function () { return null; } },
    console: console, fetch: function () { return Promise.reject(new Error('сети нет')); },
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    URLSearchParams: URLSearchParams, AbortController: AbortController,
    Promise: Promise, JSON: JSON, Number: Number
  };
  окружение.globalThis = окружение;
  vm.runInNewContext(исходник, окружение, { filename: 'похвастаться.js' });
  await окно.Сеть.похвастаться({ игра: игра, исход: 'победа', соперники: 'боты', уровень: 'обычный', игроков: 2 });
  if (!отправленное.адрес) return '';
  const разбор = new URL(отправленное.адрес);
  return разбор.searchParams.get('url') || '';
}

async function прогнать() {
  const исходник = fs.readFileSync(ПУТЬ_ФАЙЛА, 'utf8');
  const игры = названия.сетевыеИгры().filter(function (игра) { return игра !== 'дурак'; });
  // Ноль найденных игр — провал, а не пропуск.
  проверить('у сервера найдены сетевые игры кроме дурака (' + игры.length + ')', игры.length > 0);

  for (const игра of игры) {
    const метка = названия.меткаИгры(игра);
    const ссылка = await ссылкаБраузера(исходник, игра);
    проверить(игра + ': ссылка содержит ?startapp=' + метка + (ссылка ? ' (' + ссылка + ')' : ' (ссылки нет)'),
      Boolean(метка) && ссылка.indexOf('?startapp=' + метка) !== -1 && /\?startapp=[a-z]+$/.test(ссылка));
  }

  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

прогнать();
