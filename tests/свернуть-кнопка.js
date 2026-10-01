/* =====================================================================
   КНОПКА «СВЕРНУТЬ» во всех играх (js/telegram.js + js/лист-ещё.js).

   Что проверяем, без браузера (песочница vm, поддельные Telegram и страница):
     а) Telegram 8.0, полный экран дали: кнопка есть и видна; нажатие вызывает
        exitFullscreen и ставит флаг tg_windowed в sessionStorage;
     б) после выхода из полного экрана (событие fullscreenChanged) кнопка спрятана;
     в) страница открыта заново с флагом: requestFullscreen НЕ зовут;
     г) вне Telegram и на Telegram 7.x кнопки нет (даже если isFullscreen «true»);
     д) КАЖДАЯ *.html в корне подключает js/telegram.js (иначе новая игра без
        кнопки); ноль найденных страниц — провал;
     е) лист «⋯»: строка «Во весь экран» последняя (после «Рекорды») и видна
        только в Telegram 8.0+ вне полного экрана; нажатие зовёт воВесьЭкран;
     ж) оформление: <link> на style-свернуть.css вставлен, файл есть на диске.

   Запуск:  node tests/свернуть-кнопка.js
   Ломающий запуск (портит КОПИИ во временной папке, не проект):
            node tests/свернуть-кнопка.js --сломать <папка>
   Каждая порча обязана покраснеть; выход 1 — краснеет как надо,
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

function поддельныйТелеграм(версия, начинаетсяПолным, отказ) {
  const события = {};
  const wa = {
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
  return wa;
}

/** Поднять telegram.js (и, если дали путь, лист-ещё.js) в песочнице. */
function поднять(п) {
  const страница = поддельнаяСтраница(п.безТела);
  const sessionStorage = п.память || поддельнаяПамять();
  const окно = {
    sessionStorage: sessionStorage, localStorage: поддельнаяПамять(),
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    location: { href: 'http://localhost/', search: '', hash: '' },
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  if (п.telegram) окно.Telegram = { WebApp: п.telegram };
  const песочница = {
    window: окно, document: страница, localStorage: окно.localStorage,
    sessionStorage: sessionStorage,
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

/** Все проверки против заданных файлов. Возвращает { проверок, провалы }. */
function запустить(пути, подробно) {
  let проверок = 0;
  const провалы = [];
  function проверить(условие, что) {
    проверок++;
    if (!условие) { провалы.push(что); if (подробно) console.log('  ПРОВАЛ: ' + что); }
    else if (подробно) console.log('  ок   ' + что);
  }
  const файлы = { файлTelegram: пути.telegram, файлЛиста: null };

  // а) Telegram 8.0: окно открылось полным
  {
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять(Object.assign({ telegram: wa }, файлы));
    проверить(м.сбои.length === 0, 'а: telegram.js поднялся без ошибок ' + м.сбои.join('; '));
    const к = кнопка(м.страница);
    проверить(!!к, 'а: кнопка «Свернуть» создана в полном экране');
    проверить(!!к && к.hidden === false, 'а: кнопка видна (hidden=false)');
    проверить(!!к && к.textContent === 'Свернуть', 'а: на кнопке слово «Свернуть»');
    проверить(wa.вызовы.requestFullscreen === 1, 'а: полный экран просили ровно один раз');
    if (к) к.click();
    проверить(wa.вызовы.exitFullscreen === 1, 'а: нажатие вызвало exitFullscreen');
    проверить(м.память.getItem(ФЛАГ) === '1', 'а: после нажатия в sessionStorage стоит флаг ' + ФЛАГ);
    // б) выход из полного экрана
    проверить(!!к && к.hidden === true, 'б: после выхода из полного экрана кнопка спрятана');
    wa.isFullscreen = true; wa.послать('fullscreenChanged');
    проверить(!!к && к.hidden === false, 'б: вернулись в полный экран — кнопка снова видна');
    // ж) оформление
    const ссылка = м.страница.getElementById('оформление-свернуть');
    проверить(!!ссылка, 'ж: в head вставлен <link id="оформление-свернуть">');
    const href = ссылка ? String(ссылка.href || '') : '';
    проверить(/^style-свернуть\.css/.test(href), 'ж: ссылка ведёт на style-свернуть.css (' + href + ')');
    проверить(fs.existsSync(path.join(КОРЕНЬ, 'style-свернуть.css')), 'ж: файл style-свернуть.css есть на диске');
  }

  // в) вторая страница в той же вкладке, флаг стоит
  {
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять(Object.assign({ telegram: wa, память: поддельнаяПамять({ [ФЛАГ]: '1' }) }, файлы));
    проверить(wa.вызовы.requestFullscreen === 0, 'в: с флагом requestFullscreen НЕ вызван');
    const к = кнопка(м.страница);
    проверить(!к || к.hidden === true, 'в: с флагом кнопка не показана');
  }

  // г) вне Telegram и на 7.x
  {
    const м = поднять(Object.assign({ telegram: null }, файлы));
    проверить(м.сбои.length === 0, 'г: вне Telegram страница не падает ' + м.сбои.join('; '));
    проверить(!кнопка(м.страница), 'г: вне Telegram кнопки нет');
    const wa7 = поддельныйТелеграм('7.10', true);   // нарочно «полный экран = да»: версия всё равно решает
    const м7 = поднять(Object.assign({ telegram: wa7 }, файлы));
    const к7 = кнопка(м7.страница);
    проверить(!к7 || к7.hidden === true, 'г: на Telegram 7.x кнопки нет или она скрыта');
  }

  // д) каждая страница в корне подключает js/telegram.js
  {
    const страницы = fs.readdirSync(пути.страницы).filter(ф => ф.endsWith('.html'));
    проверить(страницы.length > 0, 'д: в корне найдены html-страницы (ноль — провал)');
    const без = страницы.filter(ф => !/<script[^>]+src="js\/telegram\.js(\?[^"]*)?"/.test(
      fs.readFileSync(path.join(пути.страницы, ф), 'utf8')));
    проверить(без.length === 0, 'д: telegram.js подключён у всех ' + страницы.length + ' страниц; нет у: ' + без.join(', '));
  }

  // е) лист «⋯»
  const строкаЛиста = (версия, полный, отказ) => {
    const wa = поддельныйТелеграм(версия, false, отказ);
    const м = поднять({ telegram: wa, файлTelegram: пути.telegram, файлЛиста: пути.лист });
    if (!отказ) wa.isFullscreen = !!полный;
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
    return { wa, м, л, внутри, рекорды, закрыть, строки, своя, лист };
  };
  {
    const р = строкаЛиста('8.0', false);
    проверить(!!р.л, 'е: лист подключился (ЛистЕщё.подключить дал дверь)');
    проверить(!!р.своя, 'е: в окне (не полный экран) на Telegram 8.0 строка «Во весь экран» есть');
    проверить(!!р.своя && !р.своя.классы.has('скрыт'), 'е: строка видна');
    const порядок = р.внутри.children;
    проверить(!!р.своя && порядок.indexOf(р.своя) === порядок.indexOf(р.рекорды) + 1,
      'е: строка стоит сразу после «Рекорды»');
    проверить(!!р.своя && порядок.indexOf(р.своя) === порядок.indexOf(р.закрыть) - 1,
      'е: строка — последняя, перед «Закрыть»');
    const до = р.wa.вызовы.requestFullscreen;
    if (р.своя) р.своя.click();
    проверить(р.wa.вызовы.requestFullscreen === до + 1, 'е: нажатие просит полный экран');
    проверить(р.л && р.лист.classList.contains('скрыт'), 'е: после нажатия лист закрыт');
  }
  {
    const р = строкаЛиста('8.0', true);
    проверить(!р.своя || р.своя.классы.has('скрыт'), 'е: в полном экране строки «Во весь экран» не видно');
  }
  {
    const р = строкаЛиста('7.10', false);
    проверить(!р.своя || р.своя.классы.has('скрыт'), 'е: на Telegram 7.x строки «Во весь экран» нет');
  }
  {
    // Telegram 8.0+, но полный экран отказал (UNSUPPORTED): строка была бы мёртвой
    const р = строкаЛиста('8.0', false, 'UNSUPPORTED');
    проверить(р.wa.вызовы.requestFullscreen >= 1, 'з: полный экран просили (и получили отказ)');
    проверить(!р.своя || р.своя.классы.has('скрыт'), 'з: после отказа UNSUPPORTED строки «Во весь экран» нет');
    const м = поднять({ telegram: поддельныйТелеграм('8.0', false, 'UNSUPPORTED'), файлTelegram: пути.telegram });
    проверить(!кнопка(м.страница), 'з: после отказа UNSUPPORTED кнопки «Свернуть» нет');
  }
  {
    // telegram.js стоит в <head>: тела страницы при запуске ещё нет
    const wa = поддельныйТелеграм('8.0', false);
    const м = поднять({ telegram: wa, файлTelegram: пути.telegram, безТела: true });
    проверить(м.сбои.length === 0, 'и: без body скрипт не падает ' + м.сбои.join('; '));
    проверить(!кнопка(м.страница) && !м.страница.body, 'и: до загрузки страницы кнопки ещё нет');
    м.страница.загрузить();
    const к = кнопка(м.страница);
    проверить(!!к && к.hidden === false, 'и: после DOMContentLoaded кнопка появилась и видна');
  }
  {
    // Запасное место: Telegram прислал полосу 0 — страница опускается под кнопку (класс на <html> + правило в css)
    const без = поддельныйТелеграм('8.0', false);
    без.contentSafeAreaInset.top = 0;
    const м0 = поднять({ telegram: без, файлTelegram: пути.telegram });
    const корень0 = м0.страница.documentElement;
    проверить(корень0.классы.has('свернуть-без-полосы'), 'к: полоса 0 — на <html> класс свернуть-без-полосы');
    проверить(корень0.классы.has('свернуть-кнопка-видна'), 'к: кнопка видна — на <html> класс свернуть-кнопка-видна');
    без.isFullscreen = false; без.послать('fullscreenChanged');
    проверить(!корень0.классы.has('свернуть-кнопка-видна'), 'к: кнопку спрятали — класс свернуть-кнопка-видна снят');
    const сполосой = поддельныйТелеграм('8.0', false);
    const м1 = поднять({ telegram: сполосой, файлTelegram: пути.telegram });
    проверить(!м1.страница.documentElement.классы.has('свернуть-без-полосы'), 'к: полоса есть — класса свернуть-без-полосы нет');
    const css = fs.readFileSync(пути.css, 'utf8');
    проверить(/html\.свернуть-без-полосы\.свернуть-кнопка-видна\s*\{[^}]*--безопасно-сверху:[^}]*!important/.test(css),
      'к: в style-свернуть.css есть правило запасного места (опускает --безопасно-сверху)');
  }
  {
    // Строка «Во весь экран» в готовой разметке витрины (свой лист, не js/лист-ещё.js)
    const разметка = fs.readFileSync(path.join(пути.страницы, 'index.html'), 'utf8');
    проверить(/class="[^"]*лист-ещё__строка--весь-экран[^"]*"/.test(разметка),
      'л: в index.html в листе «⋯» витрины есть строка «Во весь экран» (класс лист-ещё__строка--весь-экран)');
    const собрать = (версия, полный) => {
      // флаг стоит: страница не просит полный экран сама, и окно остаётся обычным
      const wa = поддельныйТелеграм(версия, !!полный);
      const м = поднять({ telegram: wa, файлTelegram: пути.telegram, память: поддельнаяПамять({ [ФЛАГ]: '1' }), безТела: true });
      const лист = new Узел('div'); лист.classList.add('лист-ещё');
      const внутри = new Узел('div');
      const строка = new Узел('button'); строка.classList.add('лист-ещё__строка--весь-экран'); строка.classList.add('скрыт');
      const закрыть = new Узел('button'); закрыть.classList.add('лист-ещё__закрыть');
      let закрыли = 0; закрыть.addEventListener('click', () => { закрыли++; });
      внутри.appendChild(строка); внутри.appendChild(закрыть); лист.appendChild(внутри);
      м.страница.documentElement.appendChild(лист);
      м.страница.загрузить();
      return { wa, строка, счётЗакрытий: () => закрыли };
    };
    const а8 = собрать('8.0', false);
    проверить(!а8.строка.классы.has('скрыт'), 'л: Telegram 8.0, окно обычное — строка в листе витрины видна');
    а8.строка.click();
    проверить(а8.wa.вызовы.requestFullscreen === 1, 'л: нажатие на строку просит полный экран');
    проверить(а8.счётЗакрытий() === 1, 'л: нажатие закрывает лист витрины (нажало его «Закрыть»)');
    проверить(а8.строка.классы.has('скрыт'), 'л: экран стал полным — строка спрятана');
    const п8 = собрать('8.0', true);
    проверить(п8.строка.классы.has('скрыт'), 'л: в полном экране строка в листе витрины скрыта');
    const с7 = собрать('7.10', false);
    проверить(с7.строка.классы.has('скрыт'), 'л: на Telegram 7.x строка в листе витрины скрыта');
  }
  return { проверок, провалы };
}

// ---------------------------------------------------------------- порчи копий

const ПОРЧИ = [
  { имя: 'нажатие не выходит из полного экрана', файл: 'telegram', от: 'приложение.exitFullscreen();', на: '/* порча */' },
  { имя: 'флаг не учитывается при старте', файл: 'telegram', от: 'if (читатьФлагСвёрнуто()) return false;', на: '' },
  { имя: 'кнопка не прячется', файл: 'telegram', от: 'кнопкаСвернуть.hidden = !нужна;', на: 'кнопкаСвернуть.hidden = false;' },
  { имя: 'версию Telegram не смотрят', файл: 'telegram', от: 'var нужна = можноПолныйЭкран() && вПолномЭкране();', на: 'var нужна = вПолномЭкране();' },
  { имя: 'лист не знает про полный экран', файл: 'лист', от: "return !(typeof т.вПолномЭкране === 'function' && т.вПолномЭкране());", на: 'return true;' },
  { имя: 'строка не последняя в листе', файл: 'лист', от: 'контейнер.insertBefore(узел, закрытие);', на: 'контейнер.insertBefore(узел, контейнер.children[0]);' },
  { имя: 'отказ UNSUPPORTED не учитывается', файл: 'telegram', от: " && полныйЭкран.отказ !== 'UNSUPPORTED'", на: '' },
  { имя: 'без body кнопка не дожидается страницы', файл: 'telegram', от: "document.addEventListener('DOMContentLoaded', освежитьКнопкуСвернуть);", на: '' },
  { имя: 'полоса 0 не помечается классом', файл: 'telegram', от: "узел.classList.toggle('свернуть-без-полосы', пиксели(телеграм.top) === 0);", на: '' },
  { имя: 'не помечается видимость кнопки', файл: 'telegram', от: "корень.classList.toggle('свернуть-кнопка-видна', нужна);", на: '' },
  { имя: 'в css нет запасного места (без !important)', файл: 'css', от: ') + 32px) !important;', на: ') + 32px);' },
  { имя: 'строки витрины не оживают', файл: 'telegram', от: "строка.classList.toggle('скрыт', !видна);", на: '' },
  { имя: 'в листе витрины нет строки «Во весь экран»', файл: 'страница', правка: (ф, текст) => ф === 'index.html' ? текст.split('лист-ещё__строка--весь-экран').join('другое') : текст },
  { имя: 'страница без telegram.js', файл: 'страница', правка: (ф, текст) => ф === 'index.html' ? текст.replace(/<script[^>]+src="js\/telegram\.js[^>]*><\/script>/, '') : текст }
];

function сломанныеКопии(папка) {
  fs.mkdirSync(папка, { recursive: true });
  const исходные = {
    telegram: path.join(КОРЕНЬ, 'js', 'telegram.js'), лист: path.join(КОРЕНЬ, 'js', 'лист-ещё.js'),
    css: path.join(КОРЕНЬ, 'style-свернуть.css')
  };
  return ПОРЧИ.map((порча, i) => {
    const место = path.join(папка, 'порча-' + i);
    fs.mkdirSync(место, { recursive: true });
    const пути = { telegram: исходные.telegram, лист: исходные.лист, css: исходные.css, страницы: КОРЕНЬ };
    if (порча.файл === 'страница') {
      fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).forEach(ф => {
        const текст = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
        const после = порча.правка(ф, текст);
        if (ф === 'index.html' && после === текст) порча.нетМеста = true;
        fs.writeFileSync(path.join(место, ф), после);
      });
      пути.страницы = место;
    } else {
      const текст = fs.readFileSync(исходные[порча.файл], 'utf8');
      if (текст.indexOf(порча.от) < 0) { порча.нетМеста = true; }
      const копия = path.join(место, порча.файл + (порча.файл === 'css' ? '.css' : '.js'));
      fs.writeFileSync(копия, текст.split(порча.от).join(порча.на));
      пути[порча.файл] = копия;
    }
    return { порча, пути };
  });
}

// ---------------------------------------------------------------- запуск

const аргументы = process.argv.slice(2);
const номерФлага = аргументы.indexOf('--сломать');

if (номерФлага < 0) {
  const итог = запустить({
    telegram: path.join(КОРЕНЬ, 'js', 'telegram.js'),
    лист: path.join(КОРЕНЬ, 'js', 'лист-ещё.js'),
    css: path.join(КОРЕНЬ, 'style-свернуть.css'),
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
  сломанныеКопии(папка).forEach(({ порча, пути }) => {
    if (порча.нетМеста) {
      непокраснели++;
      console.log('  НЕТ МЕСТА ДЛЯ ПОРЧИ (текст в файле изменился): ' + порча.имя);
      return;
    }
    const итог = запустить(пути, false);
    всегоПроверок += итог.проверок;
    всегоПровалов += итог.провалы.length;
    if (итог.провалы.length) console.log('  краснеет: ' + порча.имя + ' (провалов ' + итог.провалы.length + ')');
    else { непокраснели++; console.log('  НЕ КРАСНЕЕТ: ' + порча.имя); }
  });
  console.log('Итого проверок: ' + всегоПроверок + ', провалов: ' + всегоПровалов);
  process.exit(непокраснели ? 3 : 1);
}
