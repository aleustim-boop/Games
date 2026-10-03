/* =====================================================================
   КНОПКА «СВЕРНУТЬ» ВЫКЛЮЧЕНА (проба владельца 03.10, вариант Б): своей
   стрелки нет, сворачивает сам Telegram (системная кнопка, жест вниз).
   Код кнопки в js/telegram.js цел и спрятан за переключателем
   КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА; true возвращает её одной строкой.

   Что проверяем, без браузера (песочница vm, поддельные Telegram и страница):
     а) Telegram 8.0, полный экран дали: кнопки .свернуть-окно нет, класса
        свернуть-кнопка-видна на <html> нет, ссылки на style-свернуть.css нет;
        полный экран при этом просили ровно раз (он работает как прежде);
     б) события fullscreenChanged (выход и возврат) кнопку не оживляют;
     в) полоса 0 (запасное место) — класса свернуть-кнопка-видна всё равно нет;
     г) вне Telegram и на Telegram 7.x кнопки нет;
     д) КАЖДАЯ *.html в корне подключает js/telegram.js; ноль страниц — провал;
     е) лист «⋯»: строка «Во весь экран» последняя, видна только в Telegram 8.0+
        вне полного экрана; нажатие зовёт requestFullscreen;
     ж) в telegram.js переключатель стоит и равен false (ноль найденных — провал);
     з) страница с «tg_windowed» не просит полный экран (как раньше);
     и) строка «Во весь экран» в листе витрины (index.html) жива.

   Запуск:  node tests/свернуть-кнопка.js
   Ломающий запуск (портит КОПИИ во временной папке, не проект):
            node tests/свернуть-кнопка.js --сломать <папка>
   Копии telegram.js лежат в <папка>/порча-N/; путь к копии проверка получает
   доводом. Каждая порча обязана покраснеть; выход 1 — краснеют как надо,
   выход 3 — какая-то порча НЕ покраснела (проверка украшение).
   Итог — строкой «Итого проверок: N, провалов: M».
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const КОРЕНЬ = path.join(__dirname, '..');
const ФЛАГ = 'tg_windowed';

// ---------------------------------------------------------------- поддельная страница

class Узел {
  constructor(тег) {
    this.тег = тег;
    this.children = [];
    this.parentNode = null;
    this.слушатели = {};
    this.атрибуты = {};
    this.классы = new Set();
    this.hidden = false;
    this.textContent = '';
    this.id = '';
    this.style = { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' };
    const сам = this;
    this.classList = {
      add(к) { сам.классы.add(к); },
      remove(к) { сам.классы.delete(к); },
      contains: к => сам.классы.has(к),
      toggle(к, принудительно) {
        const да = принудительно === undefined ? !сам.классы.has(к) : !!принудительно;
        if (да) сам.классы.add(к); else сам.классы.delete(к);
        return да;
      }
    };
  }
  set className(с) { this.классы = new Set(String(с).split(/\s+/).filter(Boolean)); }
  get className() { return Array.from(this.классы).join(' '); }
  setAttribute(имя, з) { this.атрибуты[имя] = String(з); }
  getAttribute(имя) { return имя in this.атрибуты ? this.атрибуты[имя] : null; }
  appendChild(у) { у.parentNode = this; this.children.push(у); return у; }
  insertBefore(у, перед) {
    у.parentNode = this;
    const i = this.children.indexOf(перед);
    if (i < 0) this.children.push(у); else this.children.splice(i, 0, у);
    return у;
  }
  addEventListener(имя, ф) { (this.слушатели[имя] = this.слушатели[имя] || []).push(ф); }
  removeEventListener() {}
  click() { (this.слушатели.click || []).forEach(ф => ф({ target: this })); }
  focus() {}
  contains(у) { return this.children.indexOf(у) >= 0; }
  все() {
    let список = [];
    this.children.forEach(д => { список.push(д); список = список.concat(д.все()); });
    return список;
  }
  /** Понимает только «.класс» и «.класс:not(.другой)». */
  querySelector(сел) {
    const м = /^\.([^:\s]+)(?::not\(\.([^)]+)\))?$/.exec(сел);
    if (!м) return null;
    return this.все().find(у => у.классы.has(м[1]) && !(м[2] && у.классы.has(м[2]))) || null;
  }
  querySelectorAll(сел) {
    const м = /^\.([^:\s]+)$/.exec(сел);
    return м ? this.все().filter(у => у.классы.has(м[1])) : [];
  }
}

function поддельнаяСтраница(безТела) {
  const html = new Узел('html');
  const head = new Узел('head');
  const body = new Узел('body');
  const слушателиСтраницы = {};
  const страница = {
    readyState: безТела ? 'loading' : 'complete', documentElement: html, head: head, body: безТела ? null : body,
    // Страница дочиталась: появляется тело и приходит DOMContentLoaded
    загрузить() {
      страница.body = body; страница.readyState = 'complete';
      (слушателиСтраницы.DOMContentLoaded || []).forEach(ф => ф());
    },
    createElement: тег => new Узел(тег),
    getElementById(id) {
      return [html, head, body].concat(html.все(), head.все(), body.все())
        .find(у => у.id === id) || null;
    },
    querySelector: () => null, querySelectorAll: сел => html.querySelectorAll(сел),
    addEventListener(имя, ф) { (слушателиСтраницы[имя] = слушателиСтраницы[имя] || []).push(ф); },
    removeEventListener() {}
  };
  html.appendChild(head); html.appendChild(body);
  return страница;
}

function поддельнаяПамять(начало) {
  const ящик = Object.assign({}, начало || {});
  return {
    ящик: ящик,
    getItem: к => (к in ящик ? ящик[к] : null),
    setItem: (к, з) => { ящик[к] = String(з); },
    removeItem: к => { delete ящик[к]; }
  };
}

/** режимClose: undefined — close есть; 'нет' — метода нет; 'бросает' — close падает. */
function поддельныйТелеграм(версия, начинаетсяПолным, отказ, режимClose) {
  const события = {};
  const wa = {
    порядок: [],   // что и в каком порядке случилось: 'перед-закрытием', 'close'
    version: версия, platform: 'android', initData: 'x', initDataUnsafe: {}, themeParams: {},
    isFullscreen: !!начинаетсяПолным,
    safeAreaInset: { top: 24, bottom: 0, left: 0, right: 0 },
    contentSafeAreaInset: { top: 36, bottom: 0, left: 0, right: 0 },
    вызовы: { requestFullscreen: 0, exitFullscreen: 0 },
    isVersionAtLeast: в => parseFloat(версия) >= parseFloat(в),
    ready() {}, expand() {}, onEvent(имя, ф) { (события[имя] = события[имя] || []).push(ф); },
    offEvent() {}, CloudStorage: null, HapticFeedback: null,
    послать(имя) { (события[имя] || []).forEach(ф => ф()); },
    // Telegram соглашается и сообщает событием, как в жизни
    // С «отказом» Telegram не даёт полный экран и сообщает fullscreenFailed
    requestFullscreen() {
      wa.вызовы.requestFullscreen++;
      if (отказ) { (события.fullscreenFailed || []).forEach(ф => ф({ error: отказ })); return; }
      wa.isFullscreen = true; wa.послать('fullscreenChanged');
    },
    exitFullscreen() { wa.вызовы.exitFullscreen++; wa.isFullscreen = false; wa.послать('fullscreenChanged'); }
  };
  wa.вызовы.close = 0;
  if (режимClose !== 'нет') {
    wa.close = function () {
      wa.вызовы.close++; wa.порядок.push('close');
      if (режимClose === 'бросает') throw new Error('close упал');
    };
  }
  return wa;
}

/** Поднять telegram.js (и, если дали путь, лист-ещё.js) в песочнице. */
function поднять(п) {
  const страница = поддельнаяСтраница(п.безТела);
  const sessionStorage = п.память || поддельнаяПамять();
  const окно = {
    sessionStorage: sessionStorage, localStorage: поддельнаяПамять(),
    addEventListener() {}, removeEventListener() {},
    // Рассылку событий страницам пишем в журнал поддельного Telegram, чтобы сверить порядок с close
    dispatchEvent(е) { if (п.telegram && п.telegram.порядок) п.telegram.порядок.push(е.type); return true; },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    location: { href: 'http://localhost/', search: '', hash: '' },
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  if (п.telegram) окно.Telegram = { WebApp: п.telegram };
  const песочница = {
    window: окно, document: страница, localStorage: окно.localStorage,
    sessionStorage: sessionStorage,
    CustomEvent: class { constructor(тип) { this.type = тип; } },
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, JSON, Date, Number, String, Array, Object, Boolean, RegExp, Error, parseFloat, isFinite
  };
  песочница.globalThis = песочница;
  vm.createContext(песочница);
  const сбои = [];
  [п.файлTelegram, п.файлЛиста].filter(Boolean).forEach(файл => {
    try { vm.runInContext(fs.readFileSync(файл, 'utf8'), песочница, { filename: файл }); }
    catch (с) { сбои.push(файл + ': ' + с.message); }
  });
  return { окно, страница, сбои, память: sessionStorage };
}

const кнопка = стр => стр.documentElement.все().find(у => у.классы.has('свернуть-окно')) || null;


// ---------------------------------------------------------------- проверки

const пауза = мс => new Promise(р => setTimeout(р, мс));
const ссылкаОформления = стр => стр.getElementById('оформление-свернуть');
const классНаHtml = стр => стр.documentElement.классы.has('свернуть-кнопка-видна');

/** Все проверки против заданных файлов. Возвращает { проверок, провалы }. */
async function запустить(пути, подробно) {
  let проверок = 0;
  const провалы = [];
  function проверить(условие, что) {
    проверок++;
    if (!условие) { провалы.push(что); if (подробно) console.log('  ПРОВАЛ: ' + что); }
    else if (подробно) console.log('  ок   ' + что);
  }
  const файлы = { файлTelegram: пути.telegram, файлЛиста: null };

  // ж) переключатель на месте и выключен (читаем из того же файла, что исполняется)
  {
    const текст = fs.readFileSync(пути.telegram, 'utf8');
    const найдено = текст.match(/var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = (true|false);/g) || [];
    проверить(найдено.length === 1, 'ж: переключатель КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА найден ровно один раз (найдено ' + найдено.length + ')');
    проверить(найдено.length === 1 && /false;/.test(найдено[0]), 'ж: переключатель равен false');
  }

  // а, б, в) Telegram 8.0: окно открылось полным — кнопки нет
  {
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять(Object.assign({ telegram: wa }, файлы));
    проверить(м.сбои.length === 0, 'а: telegram.js поднялся без ошибок ' + м.сбои.join('; '));
    проверить(wa.isFullscreen === true && wa.вызовы.requestFullscreen === 1, 'а: полный экран просили ровно раз и дали (работает как прежде); просьб ' + wa.вызовы.requestFullscreen);
    проверить(!кнопка(м.страница), 'а: в полном экране кнопки .свернуть-окно нет');
    проверить(!классНаHtml(м.страница), 'а: на <html> нет класса свернуть-кнопка-видна');
    проверить(!ссылкаОформления(м.страница), 'а: ссылки на style-свернуть.css в head нет');
    проверить(!м.страница.documentElement.все().some(у => /style-свернуть/.test(String(у.href || ''))), 'а: ни один узел страницы не ссылается на style-свернуть.css');
    // б) выход из полного экрана и возврат — кнопка не оживает
    wa.isFullscreen = false; wa.послать('fullscreenChanged');
    wa.isFullscreen = true; wa.послать('fullscreenChanged');
    проверить(!кнопка(м.страница), 'б: после выхода и возврата в полный экран кнопки по-прежнему нет');
    проверить(!классНаHtml(м.страница), 'б: класса свернуть-кнопка-видна по-прежнему нет');
    проверить(!ссылкаОформления(м.страница), 'б: ссылки на оформление по-прежнему нет');
  }
  {
    // в) полоса 0: запасное место под кнопку (32px) не должно включаться
    const без = поддельныйТелеграм('8.0', false);
    без.contentSafeAreaInset.top = 0;
    const м = поднять(Object.assign({ telegram: без }, файлы));
    проверить(!классНаHtml(м.страница), 'в: полоса 0 — класса свернуть-кнопка-видна нет (запасной отступ не сработает)');
    проверить(!кнопка(м.страница), 'в: полоса 0 — кнопки нет');
  }
  {
    // и страница, у которой тела ещё нет (скрипт в head): после загрузки кнопки тоже нет
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять(Object.assign({ telegram: wa, безТела: true }, файлы));
    м.страница.загрузить();
    проверить(!кнопка(м.страница) && !классНаHtml(м.страница), 'а: после DOMContentLoaded кнопки и класса нет');
  }

  // з) страница с флагом: полный экран не просят
  {
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять(Object.assign({ telegram: wa, память: поддельнаяПамять({ [ФЛАГ]: '1' }) }, файлы));
    проверить(wa.вызовы.requestFullscreen === 0, 'з: с флагом requestFullscreen НЕ вызван');
    проверить(!кнопка(м.страница), 'з: с флагом кнопки нет');
  }

  // г) вне Telegram и на 7.x
  {
    const м = поднять(Object.assign({ telegram: null }, файлы));
    проверить(м.сбои.length === 0, 'г: вне Telegram страница не падает ' + м.сбои.join('; '));
    проверить(!кнопка(м.страница), 'г: вне Telegram кнопки нет');
    const wa7 = поддельныйТелеграм('7.10', true);
    const м7 = поднять(Object.assign({ telegram: wa7 }, файлы));
    проверить(!кнопка(м7.страница), 'г: на Telegram 7.x кнопки нет');
  }

  // д) каждая страница в корне подключает js/telegram.js
  {
    const страницы = fs.readdirSync(пути.страницы).filter(ф => ф.endsWith('.html'));
    проверить(страницы.length > 0, 'д: в корне найдены html-страницы (ноль — провал)');
    const без = страницы.filter(ф => !/<script[^>]+src="js\/telegram\.js(\?[^"]*)?"/.test(
      fs.readFileSync(path.join(пути.страницы, ф), 'utf8')));
    проверить(без.length === 0, 'д: telegram.js подключён у всех ' + страницы.length + ' страниц; нет у: ' + без.join(', '));
  }

  // е) лист «⋯»: строка «Во весь экран» живёт как прежде
  const строкаЛиста = (версия, полный) => {
    const wa = поддельныйТелеграм(версия, false);
    const м = поднять({ telegram: wa, файлTelegram: пути.telegram, файлЛиста: пути.лист });
    wa.isFullscreen = !!полный;
    const стр = м.страница;
    const лист = new Узел('div'); лист.id = 'лист-игры'; лист.classList.add('скрыт');
    const внутри = new Узел('div'); внутри.classList.add('лист-ещё__лист');
    const рекорды = new Узел('button'); рекорды.id = 'кнопка-лист-игры-рекорды'; рекорды.classList.add('лист-ещё__строка');
    const закрыть = new Узел('button'); закрыть.classList.add('лист-ещё__закрыть');
    внутри.appendChild(рекорды); внутри.appendChild(закрыть); лист.appendChild(внутри);
    стр.body.appendChild(лист);
    const открывашка = new Узел('button'); открывашка.id = 'кнопка-игра-ещё'; стр.body.appendChild(открывашка);
    const л = м.окно.ЛистЕщё && м.окно.ЛистЕщё.подключить({ двери: {}, идОткрывающих: ['кнопка-игра-ещё'] });
    if (л) л.открыть();
    const строки = внутри.children.filter(у => у.классы.has('лист-ещё__строка'));
    const своя = строки.find(у => у.children.some(д => д.textContent === 'Во весь экран')) || null;
    return { wa, л, внутри, рекорды, закрыть, своя, лист };
  };
  {
    const р = строкаЛиста('8.0', false);
    проверить(!!р.л, 'е: лист подключился (ЛистЕщё.подключить дал дверь)');
    проверить(!!р.своя && !р.своя.классы.has('скрыт'), 'е: в обычном окне на Telegram 8.0 строка «Во весь экран» есть и видна');
    const порядок = р.внутри.children;
    проверить(!!р.своя && порядок.indexOf(р.своя) === порядок.indexOf(р.рекорды) + 1 && порядок.indexOf(р.своя) === порядок.indexOf(р.закрыть) - 1,
      'е: строка стоит сразу после «Рекорды», последней перед «Закрыть»');
    const до = р.wa.вызовы.requestFullscreen;
    if (р.своя) р.своя.click();
    проверить(р.wa.вызовы.requestFullscreen === до + 1, 'е: нажатие просит полный экран');
  }
  {
    const р = строкаЛиста('8.0', true);
    проверить(!р.своя || р.своя.классы.has('скрыт'), 'е: в полном экране строки «Во весь экран» не видно');
    const р7 = строкаЛиста('7.10', false);
    проверить(!р7.своя || р7.своя.классы.has('скрыт'), 'е: на Telegram 7.x строки «Во весь экран» нет');
  }

  // и) строка «Во весь экран» в листе витрины
  {
    const разметка = fs.readFileSync(path.join(пути.страницы, 'index.html'), 'utf8');
    проверить(/class="[^"]*лист-ещё__строка--весь-экран[^"]*"/.test(разметка),
      'и: в index.html в листе «⋯» витрины есть строка «Во весь экран»');
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять({ telegram: wa, файлTelegram: пути.telegram, память: поддельнаяПамять({ [ФЛАГ]: '1' }), безТела: true });
    const лист = new Узел('div'); лист.classList.add('лист-ещё');
    const внутри = new Узел('div');
    const строка = new Узел('button'); строка.classList.add('лист-ещё__строка--весь-экран'); строка.classList.add('скрыт');
    внутри.appendChild(строка); лист.appendChild(внутри);
    м.страница.documentElement.appendChild(лист);
    м.страница.загрузить();
    проверить(!строка.классы.has('скрыт'), 'и: Telegram 8.0, окно обычное — строка в листе витрины видна');
    строка.click();
    проверить(wa.вызовы.requestFullscreen === 1, 'и: нажатие на строку просит полный экран');
  }
  return { проверок, провалы };
}

// ---------------------------------------------------------------- порчи копий

const ПЕРЕКЛЮЧАТЕЛЬ = 'var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = false;';
const ВЫКЛЮЧЕННАЯ_ВЕТКА = "корень0.classList.remove('свернуть-кнопка-видна');";

const ПОРЧИ = [
  { имя: 'переключатель включён (true) — кнопка вернулась', файл: 'telegram', от: ПЕРЕКЛЮЧАТЕЛЬ, на: 'var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = true;' },
  { имя: 'выключенная ветка подключает оформление', файл: 'telegram', от: '      var корень0 = корневойУзел();', на: '      подключитьОформлениеСвернуть();\n      var корень0 = корневойУзел();' },
  { имя: 'выключенная ветка ставит класс «кнопка видна»', файл: 'telegram', от: ВЫКЛЮЧЕННАЯ_ВЕТКА, на: "корень0.classList.add('свернуть-кнопка-видна');" },
  { имя: 'выключенная ветка создаёт кнопку', файл: 'telegram', от: '      if (кнопкаСвернуть) кнопкаСвернуть.hidden = true;', на: '      создатьКнопкуСвернуть();' },
  { имя: 'переключатель потерян (ноль найденных)', файл: 'telegram', от: ПЕРЕКЛЮЧАТЕЛЬ, на: 'var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = !1;' },
  { имя: 'лист не знает про полный экран', файл: 'лист', от: "return !(typeof т.вПолномЭкране === 'function' && т.вПолномЭкране());", на: 'return true;' },
  { имя: 'строки витрины не оживают', файл: 'telegram', от: "строка.classList.toggle('скрыт', !видна);", на: '' },
  { имя: 'флаг не учитывается при старте', файл: 'telegram', от: 'if (читатьФлагСвёрнуто()) return false;', на: '' },
  { имя: 'в листе витрины нет строки «Во весь экран»', файл: 'страница', правка: (ф, текст) => ф === 'index.html' ? текст.split('лист-ещё__строка--весь-экран').join('другое') : текст },
  { имя: 'страница без telegram.js', файл: 'страница', правка: (ф, текст) => ф === 'index.html' ? текст.replace(/<script[^>]+src="js\/telegram\.js[^>]*><\/script>/, '') : текст }
];

function сломанныеКопии(папка) {
  fs.mkdirSync(папка, { recursive: true });
  const исходные = {
    telegram: path.join(КОРЕНЬ, 'js', 'telegram.js'), лист: path.join(КОРЕНЬ, 'js', 'лист-ещё.js')
  };
  return ПОРЧИ.map((порча, i) => {
    const место = path.join(папка, 'порча-' + i);
    fs.mkdirSync(место, { recursive: true });
    const пути = { telegram: исходные.telegram, лист: исходные.лист, страницы: КОРЕНЬ };
    if (порча.файл === 'страница') {
      fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).forEach(ф => {
        const текст = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
        const после = порча.правка(ф, текст);
        if (ф === 'index.html' && после === текст) порча.нетМеста = true;
        fs.writeFileSync(path.join(место, ф), после);
      });
      пути.страницы = место;
    } else {
      // CRLF и LF не различаем: порча ищет места с переносом одинаково
      const текст = fs.readFileSync(исходные[порча.файл], 'utf8').replace(/\r\n/g, '\n');
      if (текст.split(порча.от).length !== 2) { порча.нетМеста = true; }   // ровно одно совпадение, иначе порча не годится
      const копия = path.join(место, порча.файл + '.js');
      fs.writeFileSync(копия, текст.split(порча.от).join(порча.на));
      пути[порча.файл] = копия;
      порча.копия = копия;
    }
    return { порча, пути };
  });
}

// ---------------------------------------------------------------- запуск

const аргументы = process.argv.slice(2);
const номерФлага = аргументы.indexOf('--сломать');

(async () => {
if (номерФлага < 0) {
  const итог = await запустить({
    telegram: path.join(КОРЕНЬ, 'js', 'telegram.js'),
    лист: path.join(КОРЕНЬ, 'js', 'лист-ещё.js'),
    страницы: КОРЕНЬ
  }, true);
  console.log('Итого проверок: ' + итог.проверок + ', провалов: ' + итог.провалы.length);
  process.exit(итог.провалы.length ? 1 : 0);
} else {
  const папка = аргументы[номерФлага + 1];
  if (!папка) { console.log('Укажи временную папку: --сломать <папка>'); process.exit(2); }
  let всегоПроверок = 0;
  let всегоПровалов = 0;
  let непокраснели = 0;
  for (const { порча, пути } of сломанныеКопии(папка)) {
    if (порча.нетМеста) {
      непокраснели++;
      console.log('  НЕТ МЕСТА ДЛЯ ПОРЧИ (текст в файле изменился): ' + порча.имя);
      continue;
    }
    const итог = await запустить(пути, false);
    всегоПроверок += итог.проверок;
    всегоПровалов += итог.провалы.length;
    if (итог.провалы.length) console.log('  краснеет: ' + порча.имя + ' (провалов ' + итог.провалы.length + ')' + (порча.копия ? ' копия: ' + порча.копия : ''));
    else { непокраснели++; console.log('  НЕ КРАСНЕЕТ: ' + порча.имя); }
  }
  console.log('Итого проверок: ' + всегоПроверок + ', провалов: ' + всегоПровалов);
  process.exit(непокраснели ? 3 : 1);
}
})();
