'use strict';
/* =====================================================================
   ПОДДЕЛЬНЫЙ TELEGRAM ЧЕСТЕН ПРО ПУНКТ «НАСТРОЙКИ».

   С 11 сентября js/telegram.js ставит на <html> класс «без-настроек»,
   когда Telegram есть, а пункта «Настройки» (SettingsButton) в его меню
   нет — так бывает в Telegram до 7.0. По этому классу оформление показывает
   нашу «⋯», иначе лист «Ещё» было бы нечем открыть.

   Общая подделка tests/поддельный-телеграм.js раньше не давала SettingsButton
   ни в одной версии — и во всех браузерных стендах с ней, даже с 7.10 и 8.0,
   вставал бы «без-настроек»: «⋯» стала бы видимой там, где у настоящего
   Telegram её нет, и проверки ловили бы ложное красное.

   Что проверяем (Node, без браузера):
     1) подделка 7.0, 7.10, 8.0 даёт SettingsButton: show/hide меняют
        isVisible, onClick + «нажатьНастройки» зовут дело, offClick отвязывает;
     2) подделка 6.0 и 6.9 пункта не даёт вовсе;
     3) настоящий js/telegram.js поверх этой подделки: «в-телеграме» стоит
        везде, «без-настроек» — только у 6.x.

   Запуск: node tests/поддельный-телеграм-настройки.js
   Проверка проверки: node tests/поддельный-телеграм-настройки.js было
     — берёт подделку из последнего коммита (без пункта «Настройки»);
       строки про 7.0 и выше обязаны покраснеть.
   ===================================================================== */
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');

/** Подделка — нынешняя или, в режиме «было», из последнего коммита. */
function взятьПодделку() {
  if (process.argv[2] !== 'было') return require(path.join(__dirname, 'поддельный-телеграм.js'));
  const файл = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'подделка-было-')), 'поддельный-телеграм.js');
  fs.writeFileSync(файл, execFileSync('git', ['show', 'HEAD:tests/поддельный-телеграм.js'], { cwd: path.join(__dirname, '..') }));
  console.log('РЕЖИМ «БЫЛО»: подделка из последнего коммита — строки про 7.0 и выше обязаны покраснеть.\n');
  return require(файл);
}
const { текстПодделки } = взятьПодделку();
const подделка = require(path.join(__dirname, 'поддельный-браузер.js'));

let провалов = 0;
function надо(условие, слова) { console.log((условие ? '  ок    — ' : '  ПЛОХО — ') + слова); if (!условие) провалов++; }

/** Выполнить подделку в пустом окне и вернуть её WebApp и ручки. */
function собратьПодделку(версия) {
  const окно = { addEventListener: function () {} };
  const песочница = { window: окно, document: { readyState: 'complete' }, setTimeout: setTimeout, JSON: JSON, Object: Object, Number: Number, String: String };
  песочница.globalThis = песочница;
  vm.createContext(песочница);
  vm.runInContext(текстПодделки({ версия: версия, подпись: 'подпись' }), песочница);
  return { WebApp: окно.Telegram.WebApp, ручки: окно.ПоддельныйТелеграм };
}

const ТЕЛЕГРАМ_JS = fs.readFileSync(path.join(__dirname, '..', 'js', 'telegram.js'), 'utf8');

console.log('=== Пункт «Настройки» в поддельном Telegram ===');
for (const версия of ['6.0', '6.9', '7.0', '7.10', '8.0']) {
  const { WebApp, ручки } = собратьПодделку(версия);
  const должен = версия.split('.')[0] >= 7;
  const пункт = WebApp.SettingsButton;
  if (!должен) {
    надо(!пункт, версия + ': пункта «Настройки» нет — как у настоящего Telegram до 7.0');
  } else {
    let позвали = 0;
    const дело = function () { позвали++; };
    const есть = Boolean(пункт) && typeof пункт.show === 'function' && typeof пункт.hide === 'function' &&
      typeof пункт.onClick === 'function' && typeof пункт.offClick === 'function';
    надо(есть && пункт.isVisible === false, версия + ': пункт «Настройки» есть, спрятан с начала');
    if (есть) {
      пункт.show();
      const виден = пункт.isVisible === true;
      пункт.hide();
      надо(виден && пункт.isVisible === false, версия + ': show/hide меняют isVisible');
      пункт.onClick(дело);
      ручки.нажатьНастройки();
      const после = позвали;
      пункт.offClick(дело);
      ручки.нажатьНастройки();
      надо(после === 1 && позвали === 1, версия + ': нажатие зовёт дело, после offClick — нет (позвали ' + позвали + ')');
    }
  }

  // Настоящий js/telegram.js поверх этой подделки.
  const документ = подделка.сделатьДокумент();
  подделка.поднять(ТЕЛЕГРАМ_JS, { документ: документ, telegram: WebApp, имяФайла: 'js/telegram.js' });
  const классы = документ.documentElement.classList;
  надо(классы.contains('в-телеграме'), версия + ': js/telegram.js видит Telegram — класс «в-телеграме»');
  надо(классы.contains('без-настроек') === !должен,
    версия + ': «без-настроек» ' + (должен ? 'не стоит — «⋯» останется спрятанной' : 'стоит — «⋯» покажется'));
}

console.log('----------------------------------------');
console.log('провалов: ' + провалов);
process.exitCode = провалов ? 1 : 0;
