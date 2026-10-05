'use strict';

const названия = require('../server/названия.js');
const билеты = require('../server/inline-столы.js');
const языки = require('../js/языки.js');

const КАРТИНКИ = {
  durak: 'img/витрина/durak.jpg', shashki: 'img/витрина/checkers.jpg',
  nardy: 'img/витрина/backgammon.jpg', deberts: 'img/витрина/deberts.jpg',
  seabattle: 'img/витрина/battleship.jpg', domino: 'img/витрина/dominoes.jpg',
  shahmaty: 'img/витрина/chess.jpg', catan: 'img/катан/обложка-v5.webp',
  poker: 'img/покер/обложка-v1.webp', monopoly: 'img/монополия/обложка-v3.webp',
  zahvat: 'img/захват/обложка.webp'
};

function карточки(запрос, настройки) {
  const язык = языки.язык(запрос.from?.language_code);
  const ф = {
    ru: ['Сыграем ', 'Один стол для всех по этой ссылке. Приглашение действует сутки.', 'Открывайте стол и присоединяйтесь. Первый вошедший выбирает настройки и начинает партию.', 'Сесть за стол'],
    uk: ['Зіграємо: ', 'Один стіл для всіх за цим посиланням. Запрошення діє добу.', 'Відкривайте стіл і приєднуйтеся. Перший гравець обирає налаштування та починає партію.', 'Сісти за стіл'],
    en: ['Play ', 'One table for everyone using this link. The invitation lasts 24 hours.', 'Open the table and join. The first player chooses settings and starts the game.', 'Join the table']
  }[язык];
  const поиск = String(запрос.query || '').trim().toLocaleLowerCase('ru');
  return названия.ИГРЫ.filter(и => [и.название, и.вИгру, и.метка, языки.текст(и.название, 'uk'), языки.текст(и.название, 'en')].join(' ').toLocaleLowerCase('ru').includes(поиск)).map(и => {
    const билет = билеты.билет(и.метка, настройки.секрет);
    const адрес = Buffer.from(настройки.сервер).toString('base64url');
    const ссылка = 'https://t.me/' + настройки.бот + '/' + настройки.приложение + '?startapp=' + билет + '-' + адрес;
    const картинка = new URL(КАРТИНКИ[и.метка], настройки.сайт).href;
    const имя = языки.текст(и.название, язык);
    const заголовок = ф[0] + (язык === 'ru' ? и.вИгру : имя) + '?';
    return {
      type: 'article', id: и.метка + '_' + билет.split('_')[4], title: заголовок,
      description: ф[1],
      thumbnail_url: картинка,
      input_message_content: {
        message_text: заголовок + '\n' + ф[2] + '\n' + ссылка,
        link_preview_options: { url: new URL(и.страница, настройки.сайт).href, prefer_large_media: true }
      },
      reply_markup: { inline_keyboard: [[{ text: ф[3] + ' · ' + имя, url: ссылка }]] }
    };
  });
}

module.exports = { карточки, КАРТИНКИ };
