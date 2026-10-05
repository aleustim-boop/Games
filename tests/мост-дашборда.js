// Проверка моста дашборда штаба: node tests/мост-дашборда.js [папка-с-мостом-и-конфигом]
// Без браузера, без сети, без настоящего cloudflared и хаба.
// Папка (по умолчанию корень проекта) — откуда берутся штаб/мост-дашборда.js и
// server/nginx/shtab.conf; ломающий запуск подставляет сюда испорченную КОПИЮ.
'use strict';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const корень = path.join(__dirname, '..');
const база = process.argv[2] ? path.resolve(process.argv[2]) : корень;
const мост = require(path.join(база, 'штаб', 'мост-дашборда.js'));
const конфиг = fs.readFileSync(path.join(база, 'server', 'nginx', 'shtab.conf'), 'utf8');

let всего = 0;
let провалов = 0;
function проверка(название, условие, подробность) {
  всего++;
  if (!условие) {
    провалов++;
    console.log('ПРОВАЛ: ' + название + (подробность ? ' — ' + подробность : ''));
  } else {
    console.log('ок: ' + название);
  }
}

const ВЫВОД_CLOUDFLARED = [
  '2026-10-05T10:00:00Z INF Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out.',
  '2026-10-05T10:00:00Z INF Requesting new quick Tunnel on trycloudflare.com...',
  '2026-10-05T10:00:02Z INF +--------------------------------------------------------------------------------------------+',
  '2026-10-05T10:00:02Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |',
  '2026-10-05T10:00:02Z INF |  https://quiet-green-fox-42.trycloudflare.com                                              |',
  '2026-10-05T10:00:02Z INF +--------------------------------------------------------------------------------------------+',
].join('\n');

// ——— 1. поиск адреса ———
const найден = мост.найтиАдрес(ВЫВОД_CLOUDFLARED);
проверка('п.1 адрес найден в выводе с рамкой', найден === 'quiet-green-fox-42.trycloudflare.com', String(найден));
проверка('п.1 пустой вывод — null', мост.найтиАдрес('') === null && мост.найтиАдрес(null) === null);

// ——— 2. подделки ———
const подделки = [
  'https://evil.com/x.trycloudflare.com',
  'https://a;rm.trycloudflare.com',
  'https://a$(id).trycloudflare.com',
  'https://a b.trycloudflare.com',
  'https://ABC.trycloudflare.com',
  'https://a.trycloudflare.com.evil.com',
  'evil.com/x.trycloudflare.com',
];
for (const п of подделки) {
  const р = мост.найтиАдрес('INF | ' + п + ' |');
  проверка('п.2 подделка отвергнута: ' + п, р === null, 'вернул ' + р);
}

// ——— 3. скрипт установки ———
for (const плохой of ['evil.com', 'a;b.trycloudflare.com', 'a$(x).trycloudflare.com', 'A.trycloudflare.com', null]) {
  let бросил = false;
  try { мост.скриптУстановки(плохой, конфиг); } catch (_) { бросил = true; }
  проверка('п.3 скриптУстановки бросает на «' + плохой + '»', бросил);
}
let скрипт = '';
try { скрипт = мост.скриптУстановки('quiet-green-fox-42.trycloudflare.com', конфиг); } catch (о) { /* ниже провал */ }
проверка('п.3 скрипт собрался', скрипт.length > 100);
const местоПроверки = скрипт.indexOf('nginx -t');
const местоReload = скрипт.indexOf('systemctl reload nginx');
проверка('п.3 nginx -t стоит ДО reload', местоПроверки > 0 && местоReload > местоПроверки);
проверка('п.3 нет слова restart', скрипт.length > 0 && !/restart/i.test(скрипт));
проверка('п.3 heredoc в кавычках', скрипт.includes("<<'SHTAB_CONF_END'"));
проверка('п.3 строка set $shtab_host с хостом', скрипт.includes('set $shtab_host "quiet-green-fox-42.trycloudflare.com";'));
проверка('п.3 откат и выход 1', /restore[\s\S]*exit 1/.test(скрипт) && скрипт.startsWith('set -u'));
проверка('п.3 защита «listen 443 ssl ровно одна»', скрипт.includes('grep -c') && скрипт.includes('listen 443 ssl') && скрипт.includes('"$COUNT" != "1"'));
проверка('п.3 include не дублируется', скрипт.includes('if ! grep -q') && скрипт.includes('include /etc/nginx/shtab-location.conf;'));
const скриптАдр = мост.скриптАдреса('quiet-green-fox-42.trycloudflare.com');
проверка('п.3 скриптАдреса: nginx -t до reload, без restart',
  скриптАдр.indexOf('nginx -t') > 0 && скриптАдр.indexOf('systemctl reload nginx') > скриптАдр.indexOf('nginx -t') && !/restart/i.test(скриптАдр));

// ——— 4. кусок конфига ———
// комментарии не считаем: в них слова «listen» и «server_name» объясняют, чего здесь нет
const конфигБезКомментариев = конфиг.split('\n').filter((с) => !/^\s*#/.test(с)).join('\n');
проверка('п.4 location ^~ /shtab/', /location \^~ \/shtab\//.test(конфигБезКомментариев));
проверка('п.4 include shtab-adres.conf', /include \/etc\/nginx\/shtab-adres\.conf;/.test(конфигБезКомментариев));
проверка('п.4 resolver', /resolver /.test(конфигБезКомментариев));
проверка('п.4 proxy_ssl_server_name on', /proxy_ssl_server_name on;/.test(конфигБезКомментариев));
проверка('п.4 Accept-Encoding ""', /proxy_set_header Accept-Encoding "";/.test(конфигБезКомментариев));
проверка('п.4 proxy_redirect', /proxy_redirect /.test(конфигБезКомментариев));
проверка('п.4 sub_filter_once off', /sub_filter_once off;/.test(конфигБезКомментариев));
проверка('п.4 нет listen', !/listen/.test(конфигБезКомментариев));
проверка('п.4 нет server_name', !/(^|\s)server_name\s/.test(конфигБезКомментариев));
проверка('п.4 нет порта 8790', !/8790/.test(конфиг));

// ——— 5. работа моста с подставными зависимостями ———
function пустить() { return new Promise((г) => setImmediate(г)); }
async function дождаться(условие) {
  for (let i = 0; i < 200 && !условие(); i++) await пустить();
}

async function проверитьРаботуМоста() {
  const вызовы = [];
  const дети = [];
  const адреса = ['first-one.trycloudflare.com', 'second-two.trycloudflare.com'];
  function подставнойЗапуск() {
    const ребёнок = new EventEmitter();
    ребёнок.stdout = new EventEmitter();
    ребёнок.stderr = new EventEmitter();
    ребёнок.kill = () => { setImmediate(() => ребёнок.emit('close', 0)); };
    const хост = адреса[дети.length];
    дети.push(ребёнок);
    setImmediate(() => {
      const строка = 'INF |  https://' + хост + '  |\n';
      ребёнок.stderr.emit('data', Buffer.from(строка));
      ребёнок.stderr.emit('data', Buffer.from(строка)); // повтор того же адреса не должен слать второй раз
    });
    return ребёнок;
  }
  const работа = мост.запустить({
    запуститьПроцесс: подставнойЗапуск,
    выполнитьСкрипт: async (id, текст) => { вызовы.push({ id, текст }); return { код: 0 }; },
    пауза: () => Promise.resolve(),
    журнал: () => {},
    конфиг: конфиг,
  });
  await дождаться(() => вызовы.length >= 1);
  проверка('п.5 первый адрес → одна отправка', вызовы.length === 1, 'вызовов ' + вызовы.length);
  проверка('п.5 это скрипт установки', вызовы.length > 0 && вызовы[0].текст.includes("<<'SHTAB_CONF_END'") && вызовы[0].текст.includes('first-one.trycloudflare.com'));
  проверка('п.5 id машины igra', вызовы.length > 0 && вызовы[0].id === '5dd873f7-48f9-4fc4-b6f0-3dc18610f400');
  дети[0] && дети[0].emit('close', 1); // туннель «умер»
  await дождаться(() => вызовы.length >= 2);
  проверка('п.5 после смерти и нового адреса — вторая отправка', вызовы.length === 2, 'вызовов ' + вызовы.length);
  проверка('п.5 вторая — скрипт адреса (без heredoc конфига)', вызовы.length > 1 && вызовы[1].текст.includes('second-two.trycloudflare.com') && !вызовы[1].текст.includes('SHTAB_CONF_END'));
  проверка('п.5 поднялось два туннеля', дети.length === 2, 'туннелей ' + дети.length);
  работа.остановить();
  await работа.готово;
}

// ——— 6. все виды абсолютных ссылок дашборда покрыты правилами sub_filter ———
function правилаSubFilter() {
  const правила = [];
  const р = /^\s*sub_filter\s+(?:'([^']*)'|"([^"]*)")\s+(?:'([^']*)'|"([^"]*)")\s*;/gm;
  let м;
  while ((м = р.exec(конфигБезКомментариев))) {
    правила.push({ ищем: м[1] !== undefined ? м[1] : м[2], вставляем: м[3] !== undefined ? м[3] : м[4] });
  }
  return правила;
}

function видыСсылок() {
  const файлы = ['дашборд.js', 'страница.js', 'важное-страница.js', 'онлайн-страница.js', 'кодекс-страница.js'];
  const виды = new Map();
  for (const имя of файлы) {
    const текст = fs.readFileSync(path.join(корень, 'штаб', имя), 'utf8');
    const шаблоны = [
      /([A-Za-z-]*(?:href|action|src))=\\?(["'])\/(?!\/)/g,
      /(fetch)\(\s*(["'])\/(?!\/)/g,
    ];
    for (const ш of шаблоны) {
      let м;
      while ((м = ш.exec(текст))) {
        const вид = м[1] === 'fetch' ? 'fetch(' + м[2] + '/' : м[1] + '=' + м[2] + '/';
        виды.set(вид, (виды.get(вид) || 0) + 1);
      }
    }
  }
  return виды;
}

const виды = видыСсылок();
проверка('п.6 в страницах дашборда найдены абсолютные ссылки', виды.size > 0, 'видов ' + виды.size);
const правила = правилаSubFilter();
проверка('п.6 в конфиге есть правила sub_filter', правила.length > 0, 'правил ' + правила.length);
for (const вид of виды.keys()) {
  const покрыт = правила.some((п) => вид.endsWith(п.ищем) && п.ищем.length > 2 && п.вставляем === п.ищем + 'shtab/');
  проверка('п.6 вид ссылки покрыт правилом: ' + вид, покрыт);
}

// ——— 7. мерки процессов и разбор флагов ———
проверка('п.7 экспорт: этоМост, этоНашТуннель, разобратьФлаги — функции',
  typeof мост.этоМост === 'function' && typeof мост.этоНашТуннель === 'function' && typeof мост.разобратьФлаги === 'function');
if (typeof мост.этоМост === 'function' && typeof мост.этоНашТуннель === 'function' && typeof мост.разобратьФлаги === 'function') {
  const мостДа = [
    '"C:\\Program Files\\nodejs\\node.exe" D:\\Claud\\Games\\штаб\\мост-дашборда.js --передний-план',
    'node D:/Claud/Games/штаб/мост-дашборда.js --передний-план',
    'node мост-дашборда.js',
  ];
  for (const с of мостДа) проверка('п.7 этоМост принимает: ' + с, мост.этоМост(с) === true);
  const мостНет = ['node не-мост-дашборда.js', 'node D:\\Games\\штаб\\сторож-дашборда.js 8791', 'node штаб/мост-дашборда.json', '', null, undefined];
  for (const с of мостНет) проверка('п.7 этоМост отвергает: ' + String(с), мост.этоМост(с) === false);

  const туннельДа = [
    '"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" tunnel --url http://127.0.0.1:8791',
    'cloudflared tunnel --url http://127.0.0.1:8791',
  ];
  for (const с of туннельДа) проверка('п.7 этоНашТуннель принимает: ' + с, мост.этоНашТуннель(с) === true);
  const туннельНет = [
    'cloudflared tunnel --url http://localhost:8765',
    '"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" tunnel --url http://localhost:8765',
    'node server.js --url http://127.0.0.1:8791',
    'не-cloudflared tunnel --url http://127.0.0.1:8791',
    'cloudflared tunnel --url http://127.0.0.1:87910',
    null,
  ];
  for (const с of туннельНет) проверка('п.7 этоНашТуннель отвергает: ' + String(с), мост.этоНашТуннель(с) === false);

  const ф0 = мост.разобратьФлаги([]);
  проверка('п.7 флаги: без аргументов — оба false', ф0.передПлан === false && ф0.остановить === false);
  const ф1 = мост.разобратьФлаги(['--передний-план']);
  проверка('п.7 флаги: --передний-план', ф1.передПлан === true && ф1.остановить === false);
  const ф2 = мост.разобратьФлаги(['--остановить']);
  проверка('п.7 флаги: --остановить', ф2.остановить === true && ф2.передПлан === false);
  const ф3 = мост.разобратьФлаги(['--чужой']);
  проверка('п.7 флаги: неизвестный флаг — оба false', ф3.передПлан === false && ф3.остановить === false);
}

проверитьРаботуМоста().then(() => {
  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}).catch((о) => {
  console.log('ПРОВАЛ: проверка упала с ошибкой: ' + (о && о.stack || о));
  console.log('Итого проверок: ' + (всего + 1) + ', провалов: ' + (провалов + 1));
  process.exit(1);
});
