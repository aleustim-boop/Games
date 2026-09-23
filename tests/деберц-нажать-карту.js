'use strict';
// Веер перекрывает середину карты. Нажимаем видимую часть, как палец,
// проверяя hit-test браузера, без force и без вызова игрового кода.
module.exports = async function нажатьКарту(страница, карта) {
  await карта.evaluate(async к => {
    await Promise.allSettled(к.getAnimations().map(a => a.finished));
  });
  const точка = await карта.evaluate(к => {
    const r = к.getBoundingClientRect();
    for (let y = r.top + 12; y < r.bottom - 8; y += 8) {
      for (let x = r.left + 6; x < r.right - 6; x += 5) {
        if (к.contains(document.elementFromPoint(x, y))) return { x, y };
      }
    }
    return null;
  });
  if (!точка) {
    await страница.screenshot({ path: 'tests/снимки/деберц-недоступная-карта.png' });
    throw Error('Карта полностью перекрыта: ' + await карта.getAttribute('aria-label'));
  }
  await страница.mouse.click(точка.x, точка.y);
};
