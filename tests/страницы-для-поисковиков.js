// Проверка «страницы видны поисковикам и мессенджерам» (план привлечения, раздел 7, пп. 1–3).
// Без браузера. Запуск: node tests/страницы-для-поисковиков.js [--корень=<папка-копия>]
// Список страниц берётся с диска (все *.html в корне минус исключения): новая страница
// без тегов роняет проверку. Видимость игры на витрине — из js/игры-реестр.js и плиток index.html.
const fs = require('fs');
const path = require('path');

const САЙТ = 'https://igra.medart.com.ua/';
// Страницы, которые не проверяем: бастион ведёт другой исполнитель.
const ИСКЛЮЧЕНИЯ = new Set(['бастион.html']);
const ВИТРИНА = 'index.html';
const ОБЩИЙ_ЗАГОЛОВОК = 'Игры с друзьями';

let корень = path.join(__dirname, '..');
let путьКартыДовод = null; // --карта=<файл>: испорченная копия sitemap.xml для ломающего запуска
for (const довод of process.argv.slice(2)) {
  if (довод.startsWith('--карта=')) путьКартыДовод = path.resolve(довод.substring('--карта='.length));
  if (довод.startsWith('--корень=')) корень = path.resolve(довод.substring('--корень='.length));
}

let проверок = 0;
const провалы = [];
function проверить(условие, сообщение) {
  проверок++;
  if (!условие) провалы.push('  ' + сообщение);
}

function раскодироватьЗнаки(с) {
  return с.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

// Достаёт значение атрибута из текста одного тега
function атрибут(тег, имя) {
  const м = new RegExp('(?:^|\\s)' + имя + '\\s*=\\s*"([^"]*)"', 'i').exec(тег);
  return м ? раскодироватьЗнаки(м[1]) : null;
}

// Читает из <head> все теги meta/link и title
function разобратьГолову(текст) {
  const голова = (/<head[\s\S]*?<\/head>/i.exec(текст) || [''])[0];
  const результат = { мета: {}, canonical: null, title: null };
  const название = /<title>([^<]*)<\/title>/i.exec(голова);
  if (название) результат.title = раскодироватьЗнаки(название[1]).trim();
  for (const тег of голова.match(/<meta\b[^>]*>/gi) || []) {
    const ключ = атрибут(тег, 'property') || атрибут(тег, 'name');
    const значение = атрибут(тег, 'content');
    if (ключ && значение !== null) результат.мета[ключ] = значение;
  }
  for (const тег of голова.match(/<link\b[^>]*>/gi) || []) {
    if ((атрибут(тег, 'rel') || '').toLowerCase() === 'canonical') результат.canonical = атрибут(тег, 'href');
  }
  return результат;
}

function адресСтраницы(файл) {
  return файл === ВИТРИНА ? САЙТ : САЙТ + encodeURIComponent(файл);
}

// Какая страница стоит за адресом из sitemap (или null)
function страницаПоАдресу(адрес) {
  if (адрес === САЙТ) return ВИТРИНА;
  if (!адрес.startsWith(САЙТ)) return null;
  try { return decodeURIComponent(адрес.substring(САЙТ.length)); } catch (е) { return null; }
}

// Видимые на витрине игры: у плитки есть data-игра, а ключ ведёт к странице через реестр
function видимыеСтраницы(текстВитрины) {
  const реестрПуть = path.join(корень, 'js', 'игры-реестр.js');
  let реестр = null;
  try { реестр = require(реестрПуть); } catch (е) { реестр = null; }
  проверить(реестр !== null, 'не загрузился реестр игр: ' + реестрПуть);
  const видимые = new Set();
  if (!реестр) return { видимые };
  for (const игра of реестр.все()) {
    if (игра.страница === ВИТРИНА || ИСКЛЮЧЕНИЯ.has(игра.страница)) continue;
    if (текстВитрины.indexOf('data-игра="' + игра.ключ + '"') >= 0) видимые.add(игра.страница);
  }
  return { видимые };
}

function проверитьСтраницу(файл) {
  const текст = fs.readFileSync(path.join(корень, файл), 'utf8');
  const г = разобратьГолову(текст);
  const м = г.мета;
  const метка = файл + ': ';
  const естьTitle = г.title !== null && г.title.length > 0;
  проверить(естьTitle, метка + 'нет <title>');
  if (естьTitle) {
    проверить(г.title.length < 65, метка + 'title длиннее 64 знаков (' + г.title.length + ')');
    if (файл !== ВИТРИНА) {
      проверить(г.title !== ОБЩИЙ_ЗАГОЛОВОК && !/— Игры с друзьями$/.test(г.title),
        метка + 'title общий, не про эту игру: «' + г.title + '»');
    } else {
      проверить(г.title !== ОБЩИЙ_ЗАГОЛОВОК, метка + 'title витрины остался общим');
    }
  }
  const описание = м['description'];
  проверить(typeof описание === 'string', метка + 'нет <meta name="description">');
  if (typeof описание === 'string') {
    проверить(описание.length >= 120 && описание.length <= 160,
      метка + 'description ' + описание.length + ' знаков, нужно 120–160');
  }
  for (const ключ of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'twitter:card']) {
    проверить(typeof м[ключ] === 'string' && м[ключ].length > 0, метка + 'нет ' + ключ);
  }
  проверить(м['og:type'] === 'website', метка + 'og:type не website');
  проверить(м['og:locale'] === 'ru_RU', метка + 'og:locale не ru_RU');
  проверить(м['twitter:card'] === 'summary_large_image', метка + 'twitter:card не summary_large_image');
  if (естьTitle) проверить(м['og:title'] === г.title, метка + 'og:title не совпадает с title');
  if (typeof описание === 'string') проверить(м['og:description'] === описание, метка + 'og:description не совпадает с description');
  проверить(г.canonical !== null, метка + 'нет <link rel="canonical">');
  if (г.canonical !== null) {
    проверить(г.canonical === м['og:url'], метка + 'canonical не совпадает с og:url');
    проверить(г.canonical === адресСтраницы(файл), метка + 'canonical не ведёт на эту страницу: ' + г.canonical);
  }
  const картинка = м['og:image'];
  if (typeof картинка === 'string') {
    проверить(картинка.startsWith(САЙТ), метка + 'og:image не с адреса сайта: ' + картинка);
    let файлКартинки = null;
    try { файлКартинки = decodeURIComponent(картинка.substring(САЙТ.length)); } catch (е) { файлКартинки = null; }
    проверить(файлКартинки !== null && файлКартинки.length > 0 && fs.existsSync(path.join(корень, файлКартинки)),
      метка + 'og:image указывает на файл, которого нет на диске: ' + картинка);
  }
}

// Папки правил игр, которые владелец спрятал с витрины (поле «спрятана» в реестре).
// Папка правил = имя страницы без .html (2048, nonogram…) или метка из штаб/скрипты/страницы-правил.js (monopoly, poker).
function папкиСпрятанныхИгр() {
  const папки = new Set();
  let реестр = null;
  try { реестр = require(path.join(корень, 'js', 'игры-реестр.js')); } catch (е) { реестр = null; }
  проверить(реестр !== null, 'не загрузился реестр игр для поля «спрятана»');
  if (!реестр) return папки;
  const спрятанныеСтраницы = new Set();
  for (const игра of реестр.все()) {
    if (!игра.спрятана) continue;
    спрятанныеСтраницы.add(игра.страница);
    папки.add(игра.страница.replace(/\.html$/i, ''));
  }
  const { игры } = require(path.join(__dirname, '..', 'штаб', 'скрипты', 'страницы-правил.js'));
  for (const [метка, страница] of игры) if (спрятанныеСтраницы.has(страница)) папки.add(метка);
  return папки;
}

function проверитьКарту(страницы, видимые) {
  const путьКарты = путьКартыДовод || path.join(корень, 'sitemap.xml');
  const естьКарта = fs.existsSync(путьКарты);
  проверить(естьКарта, 'нет sitemap.xml');
  if (!естьКарта) return;
  const карта = fs.readFileSync(путьКарты, 'utf8');
  const адреса = [];
  const повтор = /<loc>([^<]*)<\/loc>/g;
  let м;
  while ((м = повтор.exec(карта)) !== null) адреса.push(раскодироватьЗнаки(м[1]).trim());
  проверить(адреса.length > 0, 'sitemap.xml: ни одного адреса');
  const вКарте = new Set();
  const спрятанныеПапки = папкиСпрятанныхИгр();
  for (const адрес of адреса) {
    const путьАдреса = адрес.startsWith(САЙТ) ? адрес.substring(САЙТ.length) : null;
    // Публичный список лидеров: страницу собирает сервер, файла на диске нет
    if (путьАдреса === 'top') {
      const серверТекст = fs.readFileSync(path.join(__dirname, '..', 'server', 'сервер.js'), 'utf8');
      проверить(серверТекст.indexOf("'/top'") >= 0, 'sitemap.xml: адрес /top есть, а сервер такой страницы не отдаёт');
      continue;
    }
    // Статические страницы правил: rules/ и rules/<игра>/ — это папки с index.html
    if (путьАдреса !== null && (путьАдреса === 'rules/' || /^rules\/[^/]+\/$/.test(путьАдреса))) {
      const файлПравил = path.join(корень, путьАдреса, 'index.html');
      const естьФайл = fs.existsSync(файлПравил);
      проверить(естьФайл, 'sitemap.xml: адрес без страницы правил на диске: ' + адрес);
      if (естьФайл && путьАдреса !== 'rules/') {
        проверить(разобратьГолову(fs.readFileSync(файлПравил, 'utf8')).canonical === адрес,
          'sitemap.xml: адрес правил записан не так, как canonical: ' + адрес);
      }
      const папка = путьАдреса.split('/')[1];
      проверить(!спрятанныеПапки.has(папка),
        'sitemap.xml: правила спрятанной с витрины игры не должны быть в карте: ' + адрес);
      вКарте.add(путьАдреса);
      continue;
    }
    const страница = страницаПоАдресу(адрес);
    проверить(страница !== null && fs.existsSync(path.join(корень, страница)),
      'sitemap.xml: адрес без страницы на диске: ' + адрес);
    if (страница !== null) {
      вКарте.add(страница);
      проверить(страница === ВИТРИНА ? адрес === САЙТ : адрес === адресСтраницы(страница),
        'sitemap.xml: адрес записан не так, как canonical: ' + адрес);
      проверить(страницы.includes(страница) && (страница === ВИТРИНА || видимые.has(страница)),
        'sitemap.xml: страница спрятана с витрины или не проверяется: ' + страница);
    }
  }
  проверить(вКарте.has(ВИТРИНА), 'sitemap.xml: нет витрины');
  for (const страница of видимые) {
    проверить(вКарте.has(страница), 'sitemap.xml: видимой игры нет в карте: ' + страница);
  }
}

function проверитьРоботов() {
  const путь = path.join(корень, 'robots.txt');
  const есть = fs.existsSync(путь);
  проверить(есть, 'нет robots.txt');
  if (!есть) return;
  const текст = fs.readFileSync(путь, 'utf8');
  проверить(текст.indexOf('Sitemap: ' + САЙТ + 'sitemap.xml') >= 0, 'robots.txt: нет строки Sitemap');
  проверить(!/^Disallow:\s*\/\s*$/m.test(текст), 'robots.txt: закрыт весь сайт');
}

const страницы = fs.readdirSync(корень)
  .filter((и) => и.toLowerCase().endsWith('.html') && !ИСКЛЮЧЕНИЯ.has(и) && fs.statSync(path.join(корень, и)).isFile())
  .sort();
// Ноль страниц — это провал, а не «нечего проверять»
проверить(страницы.length > 0, 'не найдено ни одной страницы *.html в ' + корень);
проверить(страницы.includes(ВИТРИНА), 'нет витрины ' + ВИТРИНА);

for (const файл of страницы) проверитьСтраницу(файл);

const текстВитрины = страницы.includes(ВИТРИНА) ? fs.readFileSync(path.join(корень, ВИТРИНА), 'utf8') : '';
const { видимые } = видимыеСтраницы(текстВитрины);
проверить(видимые.size > 0, 'на витрине не найдено ни одной игры (ни одной плитки data-игра из реестра)');
// Видимая игра обязана быть в списке проверяемых страниц, иначе тегов у неё никто не посмотрит
for (const страница of видимые) {
  проверить(страницы.includes(страница), 'видимой игры нет среди страниц на диске: ' + страница);
}
проверитьКарту(страницы, видимые);
проверитьРоботов();

console.log('Страниц проверено: ' + страницы.length + ', видимых игр: ' + видимые.size);
console.log('Итого проверок: ' + проверок + ', провалов: ' + провалы.length);
if (провалы.length > 0) {
  console.log('\nПровалы:');
  console.log(провалы.join('\n'));
  process.exit(1);
}
