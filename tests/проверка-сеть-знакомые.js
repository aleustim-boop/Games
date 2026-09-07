'use strict';

/* Проверка Сеть.списокЗнакомых() — настоящим кодом js/сеть.js.
   Страницы у нас нет, поэтому вокруг файла собрана простая имитация
   браузера: окно, память, пустая разметка. Сервер поднимается свой,
   на порту 8793 — рабочий на 8790 не трогаем. */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');

const КОРЕНЬ = require('path').resolve(__dirname, '..');   // корень проекта — от этого файла, а не зашитый
const сервер = require(path.join(КОРЕНЬ, 'server/сервер.js'));
const знакомые = require(path.join(КОРЕНЬ, 'server/знакомые.js'));

const ПОРТ = 8794;
const АДРЕС = 'http://127.0.0.1:' + ПОРТ;
const ПУСТОЙ_ПОРТ = 'http://127.0.0.1:8123';   // там нет никого

const токен = (сервер.прочитатьНастройки().BOT_TOKEN || '').trim();
if (!токен) {
  console.log('НЕТ ТОКЕНА в bot/.env — проверка не пойдёт.');
  process.exit(2);
}

function подписать(кто) {
  const поля = new URLSearchParams();
  поля.set('user', JSON.stringify(кто));
  поля.set('auth_date', String(Math.floor(Date.now() / 1000)));
  const строки = [];
  for (const пара of поля) строки.push(пара[0] + '=' + пара[1]);
  строки.sort();
  const ключ = crypto.createHmac('sha256', 'WebAppData').update(токен).digest();
  поля.set('hash', crypto.createHmac('sha256', ключ).update(строки.join('\n')).digest('hex'));
  return поля.toString();
}

const аня = подписать({ id: 900001, first_name: 'Аня' });
const боря = подписать({ id: 900002, first_name: 'Боря' });

/* ---------- имитация браузера ---------- */

const память = new Map();
const памятьБраузера = {
  getItem: function (ключ) { return память.has(ключ) ? память.get(ключ) : null; },
  setItem: function (ключ, что) { память.set(ключ, String(что)); },
  removeItem: function (ключ) { память.delete(ключ); }
};

let сколькоЗапросов = 0;
let подменённыйОтвет = null;      // если поставить — сеть получит его вместо сервера

function нашFetch(адрес, настройки) {
  сколькоЗапросов++;
  if (подменённыйОтвет) {
    const заготовка = подменённыйОтвет;
    return Promise.resolve({
      ok: заготовка.номер >= 200 && заготовка.номер < 300,
      status: заготовка.номер,
      json: function () { return Promise.resolve(заготовка.данные); }
    });
  }
  return fetch(адрес, настройки);
}

const пустойУзел = null;          // разметки нет — игра сама это переживает
const окно = {
  location: { search: '', protocol: 'http:', href: 'http://127.0.0.1/' },
  localStorage: памятьБраузера,
  sessionStorage: памятьБраузера,
  addEventListener: function () {},
  Telegram: { WebApp: { initData: аня } }
};
const страница = {
  getElementById: function () { return пустойУзел; },
  addEventListener: function () {},
  querySelectorAll: function () { return []; },
  readyState: 'complete'
};

const окружение = {
  window: окно, document: страница, console: console,
  fetch: нашFetch, setTimeout: setTimeout, clearTimeout: clearTimeout,
  setInterval: setInterval, clearInterval: clearInterval,
  URLSearchParams: URLSearchParams, URL: URL, AbortController: AbortController,
  Promise: Promise, JSON: JSON, Date: Date, Math: Math
};
окружение.globalThis = окружение;

/* ---------- сама проверка ---------- */

let всёХорошо = true;
function проверить(что, правда) {
  console.log((правда ? '  ок   ' : '  БЕДА ') + что);
  if (!правда) всёХорошо = false;
}

function стук(путь, тело) {
  return fetch(АДРЕС + путь, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(тело || {})
  }).then(function (ответ) { return ответ.json(); });
}

async function пройти() {
  // Двое садятся за стол — сервер заводит знакомство сам.
  const создание = await стук('/создать', { initData: аня, имя: 'Аня' });
  await стук('/войти', { код: создание.код, initData: боря, имя: 'Боря' });
  проверить('знакомство на сервере есть', знакомые.сколькоЗнакомств() === 1);

  // Игра знает только вписанный адрес — как у человека, который его вписал.
  память.set('подкидной-дурак:адрес-сервера', АДРЕС);
  vm.runInNewContext(fs.readFileSync(path.join(КОРЕНЬ, 'js/сеть.js'), 'utf8'),
                     окружение, { filename: 'js/сеть.js' });
  проверить('js/сеть.js загрузился и отдал наружу Сеть.списокЗнакомых',
    окно.Сеть && typeof окно.Сеть.списокЗнакомых === 'function');

  const свежий = await окно.Сеть.списокЗнакомых();
  console.log('  свежий список: ' + JSON.stringify(свежий));
  проверить('список свежий и с сервера', свежий.свежий === true && свежий.узналиВас === true);
  проверить('в нём Боря, и он за столом',
    свежий.знакомые.length === 1 && свежий.знакомые[0].имя === 'Боря' &&
    свежий.знакомые[0].сейчасИграет === true);
  проверить('причины жаловаться нет', свежий.причина === '');

  const вПамяти = JSON.parse(память.get('подкидной-дурак:знакомые'));
  console.log('  память браузера: ' + JSON.stringify(вПамяти));
  проверить('в память браузера легли только имена',
    вПамяти.имена.length === 1 && вПамяти.имена[0] === 'Боря' &&
    Object.keys(вПамяти).sort().join(',') === 'имена,когда');

  // Сервер выключен: адрес есть, а за ним никого.
  память.set('подкидной-дурак:адрес-сервера', ПУСТОЙ_ПОРТ);
  const молчит = await окно.Сеть.списокЗнакомых();
  console.log('  когда сервер молчит: ' + JSON.stringify(молчит));
  проверить('список не пропал — показываем прежний',
    молчит.знакомые.length === 1 && молчит.знакомые[0].имя === 'Боря');
  проверить('но «сейчас играет» погашено — этого мы не знаем',
    молчит.знакомые[0].сейчасИграет === false && молчит.свежий === false);
  проверить('и есть причина словами', молчит.причина.length > 10);
  проверить('время прежнего списка сохранилось', молчит.когда === вПамяти.когда);

  // Старый сервер: такой двери у него нет.
  подменённыйОтвет = { номер: 404, данные: { ошибка: 'Такого адреса на сервере нет' } };
  const старый = await окно.Сеть.списокЗнакомых();
  console.log('  старый сервер: ' + JSON.stringify(старый.причина));
  проверить('про старый сервер сказано прямо',
    старый.свежий === false && /обнов/i.test(старый.причина) && старый.знакомые.length === 1);
  подменённыйОтвет = null;

  // Игра открыта не в Telegram — сервер тревожить незачем.
  память.set('подкидной-дурак:адрес-сервера', АДРЕС);
  окно.Telegram = null;
  const было = сколькоЗапросов;
  const безTelegram = await окно.Сеть.списокЗнакомых();
  console.log('  без Telegram: ' + JSON.stringify(безTelegram.причина));
  проверить('без подписи сервер не тревожим', сколькоЗапросов === было);
  проверить('и честно говорим почему',
    безTelegram.узналиВас === false && /Telegram/.test(безTelegram.причина) &&
    безTelegram.знакомые.length === 1);
}

сервер.запустить(ПОРТ, 2000);

пройти().then(function () {
  console.log(всёХорошо ? 'ИТОГ: всё сошлось.' : 'ИТОГ: есть беды, смотри выше.');
}).catch(function (сбой) {
  всёХорошо = false;
  console.log('Проверка сорвалась: ' + (сбой && сбой.stack || сбой));
}).then(function () {
  знакомые.забытьВсё();
  знакомые.дописать();
  process.exit(всёХорошо ? 0 : 1);
});
