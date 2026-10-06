'use strict';
const языки = require('../js/языки');
const { AsyncLocalStorage } = require('async_hooks');
const контекст = new AsyncLocalStorage();
const фразы = {
  ru: {
    коротко: 'Настольные и карточные игры прямо в Telegram — с ботом или с живыми друзьями. Ставить ничего не надо.',
    описание: 'Настольные и карточные игры прямо в Telegram. Играйте с ботами или друзьями. Добавьте меня в чат и напишите /play: выберите игру и пригласите всех за один стол.',
    привет: имя => 'Привет' + (имя ? ', ' + имя : '') + '! 🎲',
    ввод: 'Настольные и карточные игры прямо в Telegram, без установки:',
    конец: 'Жмите «Играть» и выбирайте, во что.\nА в общем чате напишите /play — соберу стол прямо там.',
    команды: ['Открыть игры', 'Позвать друзей за стол — выбрать игру', 'Собрать стол прямо в чате — выбрать игру'],
    стол: 'Стол: ', приглашение: 'Вас зовут сыграть: ', открыть: 'Жмите «Играть» — игра откроется в Telegram.',
    наДоработке: 'Эта игра пока на доработке — скоро вернём. Выберите другую:'
  },
  uk: {
    коротко: 'Настільні та карткові ігри в Telegram — з ботами або друзями. Без установлення.',
    описание: 'Настільні та карткові ігри просто в Telegram. Грайте з ботами або друзями. Додайте мене в чат і напишіть /play: оберіть гру та запросіть усіх за один стіл.',
    привет: имя => 'Привіт' + (имя ? ', ' + имя : '') + '! 🎲',
    ввод: 'Настільні та карткові ігри просто в Telegram, без установлення:',
    конец: 'Натисніть «Грати» та оберіть гру.\nУ спільному чаті напишіть /play — зберемо всіх за одним столом.',
    команды: ['Відкрити ігри', 'Запросити друзів за стіл — обрати гру', 'Зібрати стіл у чаті — обрати гру'],
    стол: 'Стіл: ', приглашение: 'Вас запрошують зіграти: ', открыть: 'Натисніть «Грати» — гра відкриється в Telegram.',
    наДоработке: 'Ця гра поки що на доопрацюванні — скоро повернемо. Оберіть іншу:'
  },
  en: {
    коротко: 'Board and card games in Telegram — with bots or friends. No installation needed.',
    описание: 'Board and card games right in Telegram. Play with bots or friends. Add me to a chat and send /play: choose a game and invite everyone to the same table.',
    привет: name => 'Hello' + (name ? ', ' + name : '') + '! 🎲',
    ввод: 'Board and card games right in Telegram, with no installation:',
    конец: 'Tap “Play” and choose a game.\nSend /play in a group chat to bring everyone to the same table.',
    команды: ['Open games', 'Invite friends to a table — choose a game', 'Start a table in this chat — choose a game'],
    стол: 'Table: ', приглашение: 'You are invited to play: ', открыть: 'Tap “Play” to open the game in Telegram.',
    наДоработке: 'This game is being reworked for now — it will be back soon. Pick another one:'
  }
};
function текущий() { return контекст.getStore() || 'ru'; }
function выполнить(обновление, работа) {
  const кто = обновление.message?.from || обновление.inline_query?.from || обновление.callback_query?.from || обновление.chosen_inline_result?.from || обновление.my_chat_member?.from;
  return контекст.run(языки.язык(кто?.language_code), работа);
}
function приветствие(имя, игры, код = текущий()) {
  const ф = фразы[код];
  return ф.привет(имя) + '\n\n' + ф.ввод + '\n' + игры.map(и => '• ' + языки.текст(и.название, код)).join('\n') + '\n\n' + ф.конец;
}
function перевестиДанные(значение, код = текущий()) {
  if (Array.isArray(значение)) return значение.map(в => перевестиДанные(в, код));
  if (!значение || typeof значение !== 'object') return значение;
  const ответ = {};
  for (const [ключ, в] of Object.entries(значение)) {
    // Только поля для чтения. URL, callback_data, коды и подписи не трогаем.
    ответ[ключ] = ['text', 'caption', 'description', 'title', 'message_text'].includes(ключ) && typeof в === 'string'
      ? текстБота(в, код) : typeof в === 'object' ? перевестиДанные(в, код) : в;
  }
  return ответ;
}
function текстБота(текст, код) {
  if (код === 'ru') return текст;
  if (текст.startsWith('Всем привет! 🎲')) return код === 'uk'
    ? 'Привіт усім! 🎲 Напишіть /play — оберіть гру та зберіть друзів за одним столом. Установлювати нічого не потрібно.'
    : 'Hello everyone! 🎲 Send /play to choose a game and bring friends to one table. No installation needed.';
  const стіл = /^(.*?) зовёт за стол (.*?)!\n\n[\s\S]*Стол ждёт (\d+) /s.exec(текст);
  if (стіл) {
    const игра = require('../server/названия').ИГРЫ.find(и => и.вИгру === стіл[2]);
    const имя = игра ? языки.текст(игра.название, код) : стіл[2];
    return код === 'uk' ? `${стіл[1]} запрошує за стіл: ${имя}!\n\nНатисніть кнопку, щоб приєднатися. Перший гравець починає партію.\nСтіл чекає ${стіл[3]} хв.`
      : `${стіл[1]} invites you to play ${имя}!\n\nTap to join. The first player starts the game.\nThe table waits ${стіл[3]} min.`;
  }
  if (текст.startsWith('Стол закрылся: за ')) return код === 'uk'
    ? 'Стіл закрився: ніхто не приєднався. Напишіть /play, щоб запросити гравців знову.'
    : 'The table closed because nobody joined. Send /play to invite players again.';
  return языки.текст(текст, код);
}
module.exports = { текущий, выполнить, приветствие, перевестиДанные, фразы, языки };
