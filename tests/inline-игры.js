'use strict';
// Настоящий сервер на свободном порту, только выдуманные пользователи.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
process.env.ДАННЫЕ_ИГРЫ = fs.mkdtempSync(path.join(os.tmpdir(), 'inline-games-'));
const секрет = 'inline-test-only';
const билеты = require('../server/inline-столы');
const карточки = require('../bot/inline-игры');
const названия = require('../server/названия');
const сервис = require('../server/сервер');
сервис.оснасткаДляПроверки(секрет, async () => ({ ok: true, result: {} }));

function подпись(номер) {
  const поля = { auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id: номер, first_name: 'Проверка' }) };
  const ключ = crypto.createHmac('sha256', 'WebAppData').update(секрет).digest();
  поля.hash = crypto.createHmac('sha256', ключ).update(Object.keys(поля).sort().map(к => к + '=' + поля[к]).join('\n')).digest('hex');
  return new URLSearchParams(поля).toString();
}

(async () => {
  const сервер = сервис.создатьСервер();
  await new Promise(готово => сервер.listen(0, '127.0.0.1', готово));
  const адрес = 'http://127.0.0.1:' + сервер.address().port;
  async function запрос(путь, тело) {
    const ответ = await fetch(адрес + encodeURI(путь), тело ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(тело) } : {});
    return { статус: ответ.status, ...await ответ.json() };
  }
  try {
    const настройки = { секрет, сервер: адрес, сайт: 'https://igra.medart.com.ua/', бот: 'test_bot', приложение: 'BoardGames' };
    const все = карточки.карточки({ query: '' }, настройки);
    // Карточек столько, сколько неспрятанных игр; спрятанные (монополия, покер…) не предлагаем
    const видимые = названия.видимыеИгры();
    assert.ok(видимые.length > 0 && видимые.length < названия.ИГРЫ.length, 'опора: часть игр спрятана в реестре');
    assert.equal(все.length, видимые.length);
    assert.equal(карточки.карточки({ query: 'монополия' }, настройки).length, 0, 'спрятанная монополия в поиске не нужна');
    assert.equal(карточки.карточки({ query: 'покер' }, настройки).length, 0, 'спрятанный покер в поиске не нужен');
    assert.equal(карточки.карточки({ query: 'ШАХМАТЫ' }, настройки).length, 1);
    assert.equal(карточки.карточки({ query: 'нет-такой-игры' }, настройки).length, 0);
    const другойНабор = карточки.карточки({ query: '' }, настройки);
    assert.notEqual(все[0].reply_markup.inline_keyboard[0][0].url, другойНабор[0].reply_markup.inline_keyboard[0][0].url);
    for (const путь of Object.values(карточки.КАРТИНКИ)) assert.ok(fs.existsSync(path.join(__dirname, '..', путь)), путь);
    const первый = (await запрос('/статистика')).сегодня.входовInline;
    let номер = 910000;
    let вошло = 0;
    for (let и = 0; и < все.length; и++) {
      const кнопка = все[и].reply_markup.inline_keyboard[0][0];
      assert.equal(кнопка.web_app, undefined);
      const хвост = new URL(кнопка.url).searchParams.get('startapp');
      assert.match(хвост, /^[A-Za-z0-9_-]{1,512}$/);
      const inline = хвост.slice(0, хвост.indexOf('-'));
      const initData = подпись(++номер);
      const initДруг = подпись(++номер);
      const пара = await Promise.all([запрос('/inline-стол', { inline, initData }), запрос('/inline-стол', { inline, initData: initДруг })]);
      assert.equal(пара[0].статус, 200, JSON.stringify(пара[0]));
      assert.equal(пара[0].код, пара[1].код, 'один билет — один стол');
      const код = пара[0].код;
      assert.equal(пара[0].игра, видимые[и].игра);
      const я = await запрос('/войти', { код, inline, initData, метка: 'inline-host-' + и });
      const друг = await запрос('/войти', { код, inline, initData: initДруг, метка: 'inline-friend-' + и });
      assert.equal(я.статус, 200, JSON.stringify(я));
      assert.equal(друг.статус, 200, JSON.stringify(друг));
      assert.notEqual(я.пропуск, друг.пропуск);
      await запрос('/войти', { код, inline, initData, метка: 'inline-host-' + и });
      const стол = await запрос('/стол?код=' + код);
      assert.equal(стол.людей, 2);
      вошло += 2;
      if (пара[0].игра === 'катан') {
        const третий = await запрос('/войти', { код, inline, initData: подпись(++номер), метка: 'inline-third' });
        assert.equal(третий.статус, 200);
        вошло++;
      }
      const старт = await запрос('/ход', { код, пропуск: я.пропуск, действие: 'начать' });
      assert.equal(старт.принято, true, пара[0].игра + ': ' + JSON.stringify(старт));
    }
    const после = await запрос('/статистика');
    assert.equal(после.сегодня.входовInline - первый, вошло, 'повторный вход не накручивает счётчик');
    assert.equal((await запрос('/inline-стол', { inline: билеты.билет('durak', секрет) })).статус, 401);
    assert.equal((await запрос('/inline-стол', { inline: билеты.билет('durak', 'чужой'), initData: подпись(920000) })).статус, 400);
    assert.equal(билеты.проверить(билеты.билет('durak', секрет, Date.now() - билеты.СРОК - 1000), секрет), null);
    const хранилище = билеты.создатьХранилище();
    const билет = билеты.билет('durak', секрет);
    let создано = 0;
    const комнаты = { создатьКомнату() { создано++; return { ок: true, код: 'ABCD' }; }, состояниеСтола() { return { есть: false }; } };
    assert.equal(хранилище.открыть(билет, секрет, комнаты, 'test').код, 'ABCD');
    assert.ok(хранилище.открыть(билет, секрет, комнаты, 'test').ошибка);
    assert.equal(создано, 1, 'закрытую комнату ссылка не воскрешает');
    // Ломающий запуск копии: удаление проверки подписи обязано сломать тест.
    const порча = билет.slice(0, -1) + (билет.endsWith('0') ? '1' : '0');
    assert.equal(билеты.проверить(порча, секрет), null);
    const исходник = fs.readFileSync(require.resolve('../server/inline-столы'), 'utf8');
    const сломанный = исходник.replace('if (!crypto.timingSafeEqual(Buffer.from(части[4]), Buffer.from(подпись(основа, секрет)))) return null;', '');
    assert.notEqual(сломанный, исходник);
    const среда = { module: { exports: {} }, require: require('module').createRequire(require.resolve('../server/inline-столы')), Buffer };
    require('vm').runInNewContext(сломанный, среда);
    assert.throws(() => assert.equal(среда.module.exports.проверить(порча, секрет), null));
    console.log('PASS: 11 игр, поиск, картинки, подписи, совместный вход и начало матчей, статистика; отключение проверки подписи в копии обнаружено.');
  } finally {
    сервер.closeAllConnections();
    await new Promise(готово => сервер.close(готово));
  }
})().catch(ошибка => { console.error(ошибка); process.exitCode = 1; });
